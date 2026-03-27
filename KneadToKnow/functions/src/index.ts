/**
 * Knead to Know — Cloud Functions
 *
 * All sensitive operations run server-side so no API keys leak to the client.
 *
 * Functions:
 *   importRecipe          – Parse pasted text into a structured recipe (Claude)
 *   importRecipeFromUrl   – Fetch URL, strip HTML, parse recipe (Claude)
 *   toggleRecipeVisibility – Toggle recipe private/shared
 *   getTemperatureFromHA  – Read temp from user's Home Assistant
 *   saveHAConfig          – Save HA credentials to Firestore
 *   deleteUserAccount     – Delete all user data + auth account
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { initializeApp } from "firebase-admin/app";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";

// ─── Init ───

initializeApp();
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

const db = getFirestore();
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

// ─── Helpers ───

function requireAuth(request: { auth?: { uid: string } }): string {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
  return request.auth.uid;
}

function getAnthropicClient(): Anthropic {
  const key = ANTHROPIC_API_KEY.value();
  if (!key) {
    throw new HttpsError("failed-precondition", "Anthropic API key not configured.");
  }
  return new Anthropic({ apiKey: key });
}

const RECIPE_PARSE_PROMPT = `You are a recipe parser for a sourdough bread baking app. Extract the COMPLETE recipe into structured JSON.

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "name": "Recipe Name",
  "ingredients": [
    { "id": "i1", "text": "500g bread flour", "sortOrder": 0 },
    { "id": "i2", "text": "350g water (70%)", "sortOrder": 1 }
  ],
  "steps": [
    { "id": "s1", "text": "Mix flour and water...", "type": "step", "sortOrder": 0 },
    { "id": "s2", "text": "Stretch and fold every 30 min, 4 sets", "type": "stretch_folds", "sortOrder": 1 },
    { "id": "s3", "text": "Bulk ferment until doubled, 4-6 hours", "type": "proof", "sortOrder": 2 },
    { "id": "s4", "text": "Preheat Dutch oven at 450°F for 45 min", "type": "step", "sortOrder": 3 },
    { "id": "s5", "text": "Bake covered 20 min, uncovered 20-25 min until deep golden", "type": "step", "sortOrder": 4 }
  ]
}

CRITICAL RULES:
1. INGREDIENTS MUST INCLUDE EXACT QUANTITIES — always include weights, volumes, or measurements (e.g. "500g bread flour" NOT just "bread flour"). If the recipe lists amounts, you MUST preserve them. If baker's percentages are given, include those too.
2. EVERY STEP must be included — do NOT stop at fermentation. You MUST include shaping, scoring, preheating, baking temperatures, baking times, cooling, and any other steps from the original recipe. A bread recipe is not complete without baking instructions.
3. Include ALL steps from start to finish — prep, mixing, folding, fermenting, shaping, proofing, baking, and cooling.

Rules for the "type" field:
- "stretch_folds" if the step involves stretch and folds, coil folds, or lamination
- "proof" if the step is bulk fermentation, proofing, cold retard, or rising
- "step" for everything else (including mixing, shaping, scoring, baking, cooling)

If the recipe name isn't obvious, generate a descriptive one.`;

async function parseRecipeWithClaude(
  content: string,
  source: string,
  uid: string
): Promise<{ recipeId: string; name: string; ingredientCount: number; stepCount: number }> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Parse this recipe:\n\n${content.slice(0, 8000)}`,
      },
    ],
    system: RECIPE_PARSE_PROMPT,
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new HttpsError("internal", "Claude returned no text response.");
  }

  let parsed: {
    name: string;
    ingredients: { id: string; text: string; sortOrder: number }[];
    steps: { id: string; text: string; type: string; sortOrder: number }[];
  };

  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new HttpsError("internal", "Could not parse Claude's response as JSON.");
  }

  if (!parsed.name || !parsed.ingredients?.length || !parsed.steps?.length) {
    throw new HttpsError("internal", "Claude returned an incomplete recipe.");
  }

  // Save to Firestore
  const recipeRef = db.collection("recipes").doc();
  await recipeRef.set({
    name: parsed.name,
    source,
    ownerId: uid,
    visibility: "private",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    totalBakes: 0,
    ingredients: parsed.ingredients,
    steps: parsed.steps,
  });

  return {
    recipeId: recipeRef.id,
    name: parsed.name,
    ingredientCount: parsed.ingredients.length,
    stepCount: parsed.steps.length,
  };
}

// ─── Rate Limiting ───

async function checkRateLimit(uid: string, limit: number = 10): Promise<void> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const rateLimitRef = db.doc(`rateLimits/${uid}_import_${today}`);
  const snap = await rateLimitRef.get();
  const count = snap.exists ? (snap.data()?.count || 0) : 0;

  if (count >= limit) {
    throw new HttpsError(
      "resource-exhausted",
      `Daily import limit reached (${limit}/day). Try again tomorrow.`
    );
  }

  await rateLimitRef.set({ count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cloud Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * importRecipe — Parse pasted text into a structured recipe
 */
export const importRecipe = onCall(
  { secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    const uid = requireAuth(request);
    const { content, source } = request.data as { content: string; source: string };

    if (!content?.trim()) {
      throw new HttpsError("invalid-argument", "Recipe content is required.");
    }

    await checkRateLimit(uid);
    return parseRecipeWithClaude(content, source || "Pasted text", uid);
  }
);

/**
 * importRecipeFromUrl — Fetch a URL, strip HTML, parse with Claude
 */
export const importRecipeFromUrl = onCall(
  { secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    const uid = requireAuth(request);
    const { url } = request.data as { url: string };

    if (!url?.trim()) {
      throw new HttpsError("invalid-argument", "URL is required.");
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("bad protocol");
      }
    } catch {
      throw new HttpsError("invalid-argument", "Please provide a valid HTTP(S) URL.");
    }

    await checkRateLimit(uid);

    // Fetch the page
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; KneadToKnow/1.0; recipe-parser)",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new HttpsError("not-found", `Could not fetch URL (HTTP ${response.status}).`);
      }

      html = await response.text();
    } catch (e: any) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError("unavailable", "Could not reach that URL. Check the link and try again.");
    }

    // Extract text content from HTML
    const $ = cheerio.load(html);

    // Remove non-content elements
    $("script, style, nav, header, footer, iframe, noscript, svg, [role='navigation']").remove();

    // Try to find structured recipe data (JSON-LD)
    let recipeText = "";
    const jsonLdScripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < jsonLdScripts.length && !recipeText; i++) {
      try {
        const jsonLd = JSON.parse($(jsonLdScripts[i]).text());
        const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
        for (const item of items) {
          if (item["@type"] === "Recipe" || item["@type"]?.includes?.("Recipe")) {
            recipeText = JSON.stringify(item, null, 2);
            break;
          }
          // Check @graph
          if (item["@graph"]) {
            for (const node of item["@graph"]) {
              if (node["@type"] === "Recipe" || node["@type"]?.includes?.("Recipe")) {
                recipeText = JSON.stringify(node, null, 2);
                break;
              }
            }
          }
          if (recipeText) break;
        }
      } catch {
        // Skip invalid JSON-LD
      }
    }

    // If no JSON-LD recipe, fall back to visible text
    if (!recipeText) {
      // Prefer article/main content if it exists
      const article = $("article, main, [role='main'], .recipe, .entry-content, .post-content");
      if (article.length) {
        recipeText = article.text();
      } else {
        recipeText = $("body").text();
      }
      // Collapse whitespace
      recipeText = recipeText.replace(/\s+/g, " ").trim();
    }

    if (!recipeText || recipeText.length < 50) {
      throw new HttpsError("not-found", "Could not find recipe content on that page.");
    }

    return parseRecipeWithClaude(recipeText, parsedUrl.hostname, uid);
  }
);

/**
 * toggleRecipeVisibility — Toggle between private and shared
 */
export const toggleRecipeVisibility = onCall(async (request) => {
  const uid = requireAuth(request);
  const { recipeId } = request.data as { recipeId: string };

  if (!recipeId) {
    throw new HttpsError("invalid-argument", "recipeId is required.");
  }

  const recipeRef = db.doc(`recipes/${recipeId}`);
  const snap = await recipeRef.get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "Recipe not found.");
  }

  const data = snap.data()!;
  if (data.ownerId !== uid) {
    throw new HttpsError("permission-denied", "You can only share your own recipes.");
  }

  const newVisibility = data.visibility === "shared" ? "private" : "shared";
  await recipeRef.update({
    visibility: newVisibility,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { visibility: newVisibility };
});

/**
 * getTemperatureFromHA — Read temperature from user's Home Assistant
 */
export const getTemperatureFromHA = onCall(async (request) => {
  const uid = requireAuth(request);

  // Get user's HA config from Firestore
  const configSnap = await db.doc(`users/${uid}/private/haConfig`).get();
  if (!configSnap.exists) {
    throw new HttpsError(
      "failed-precondition",
      "Home Assistant not configured. Go to Settings to set it up."
    );
  }

  const config = configSnap.data()!;
  const { url, token, entityId } = config as { url: string; token: string; entityId: string };

  // Call Home Assistant API
  let response: Response;
  try {
    const haUrl = `${url.replace(/\/+$/, "")}/api/states/${entityId}`;
    response = await fetch(haUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new HttpsError("unavailable", "Could not connect to Home Assistant. Check your URL.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new HttpsError("permission-denied", "Home Assistant token is invalid or expired.");
    }
    throw new HttpsError("internal", `Home Assistant error (HTTP ${response.status}).`);
  }

  const data = await response.json();
  const state = parseFloat(data.state);

  if (isNaN(state)) {
    throw new HttpsError("internal", `Sensor "${entityId}" returned non-numeric value: ${data.state}`);
  }

  const unit = data.attributes?.unit_of_measurement || "°F";
  const sensorName = data.attributes?.friendly_name || entityId;

  // Convert to Fahrenheit if needed
  let tempF = state;
  if (unit === "°C") {
    tempF = state * 9 / 5 + 32;
  }

  return {
    tempF: Math.round(tempF * 10) / 10,
    sensorName,
    unit,
  };
});

/**
 * saveHAConfig — Save Home Assistant credentials (server-side, never on client)
 */
export const saveHAConfig = onCall(async (request) => {
  const uid = requireAuth(request);
  const { url, token, entityId } = request.data as {
    url: string;
    token: string;
    entityId: string;
  };

  if (!url?.trim() || !token?.trim() || !entityId?.trim()) {
    throw new HttpsError("invalid-argument", "URL, token, and entity ID are all required.");
  }

  // Test the connection before saving
  try {
    const haUrl = `${url.replace(/\/+$/, "")}/api/states/${entityId}`;
    const response = await fetch(haUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new HttpsError("permission-denied", "Invalid token. Check your Long-Lived Access Token.");
      }
      if (response.status === 404) {
        throw new HttpsError("not-found", `Entity "${entityId}" not found in Home Assistant.`);
      }
      throw new HttpsError("internal", `Home Assistant returned HTTP ${response.status}.`);
    }
  } catch (e: any) {
    if (e instanceof HttpsError) throw e;
    throw new HttpsError("unavailable", "Could not connect to Home Assistant. Check the URL.");
  }

  // Save to a private subcollection (not readable by security rules for other users)
  await db.doc(`users/${uid}/private/haConfig`).set({
    url: url.trim(),
    token: token.trim(),
    entityId: entityId.trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * deleteUserAccount — Delete all user data + auth account
 */
export const deleteUserAccount = onCall(async (request) => {
  const uid = requireAuth(request);

  // 1. Delete all user's bake logs
  const bakes = await db.collection("bakes").where("ownerId", "==", uid).get();
  const batch1 = db.batch();
  bakes.docs.forEach((doc) => batch1.delete(doc.ref));
  if (bakes.size > 0) await batch1.commit();

  // 2. Delete all user's recipes
  const recipes = await db.collection("recipes").where("ownerId", "==", uid).get();
  const batch2 = db.batch();
  recipes.docs.forEach((doc) => batch2.delete(doc.ref));
  if (recipes.size > 0) await batch2.commit();

  // 3. Delete user's photos from Storage
  try {
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: `bake-photos/${uid}/` });
    await Promise.all(files.map((file) => file.delete()));
  } catch {
    // No photos — that's fine
  }

  // 4. Delete private subcollections (HA config, etc.)
  try {
    const privateDocs = await db.collection(`users/${uid}/private`).get();
    const batch3 = db.batch();
    privateDocs.docs.forEach((doc) => batch3.delete(doc.ref));
    if (privateDocs.size > 0) await batch3.commit();
  } catch {
    // No private docs
  }

  // 5. Delete user document
  await db.doc(`users/${uid}`).delete();

  // 6. Delete Firebase Auth account
  try {
    await getAuth().deleteUser(uid);
  } catch {
    // Auth account may already be deleted
  }

  return { success: true };
});
