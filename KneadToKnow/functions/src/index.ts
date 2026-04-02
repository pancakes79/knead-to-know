/**
 * Knead to Know — Cloud Functions
 *
 * All sensitive operations run server-side so no API keys leak to the client.
 *
 * Functions:
 *   importRecipe          – Parse pasted text into a structured recipe (Claude)
 *   importRecipeFromPdf   – Parse a PDF file into a structured recipe (Claude)
 *   importRecipeFromUrl   – Fetch URL, strip HTML, parse recipe (Claude)
 *   toggleRecipeVisibility – Toggle recipe private/shared
 *   getTemperatureFromHA  – Read temp from user's Home Assistant
 *   saveHAConfig          – Save HA credentials to Firestore
 *   deleteUserAccount     – Delete all user data + auth account
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
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

const RECIPE_PARSE_PROMPT = `You are a recipe parser for a sourdough bread baking app. Your job is to FAITHFULLY EXTRACT the recipe — not summarize, not paraphrase, not abbreviate. Preserve every detail from the original.

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "name": "Recipe Name",
  "ingredients": [
    { "id": "i1", "text": "500g bread flour", "sortOrder": 0 },
    { "id": "i2", "text": "350g water at 90°F (70%)", "sortOrder": 1 },
    { "id": "i3", "text": "10g fine sea salt", "sortOrder": 2 },
    { "id": "i4", "text": "100g active sourdough starter (100% hydration)", "sortOrder": 3 }
  ],
  "equipment": [
    { "id": "e1", "text": "Dutch oven with lid (5-7 qt)", "sortOrder": 0 },
    { "id": "e2", "text": "Digital kitchen scale", "sortOrder": 1 }
  ],
  "steps": [
    { "id": "s1", "text": "Mix 500g flour and 350g water at 90°F. Rest 30 minutes (autolyse)", "type": "step", "timerSeconds": 1800, "sortOrder": 0 },
    { "id": "s2", "text": "Add 10g salt and 100g starter, pinch and fold to incorporate", "type": "step", "sortOrder": 1 },
    { "id": "s3", "text": "Stretch and fold every 30 minutes, 4 sets", "type": "stretch_folds", "sortOrder": 2 },
    { "id": "s4", "text": "Bulk ferment at 78°F until 50% rise, about 4-5 hours total from mixing", "type": "proof", "sortOrder": 3 },
    { "id": "s5", "text": "Shape into round boule and place seam-side up in floured banneton", "type": "step", "sortOrder": 4 },
    { "id": "s6", "text": "Cold proof in refrigerator 12-16 hours", "type": "proof", "timerSeconds": 43200, "sortOrder": 5 },
    { "id": "s7", "text": "Preheat oven to 500°F with Dutch oven inside for 45-60 minutes", "type": "step", "timerSeconds": 2700, "sortOrder": 6 },
    { "id": "s8", "text": "Score dough, place in Dutch oven, bake covered at 500°F for 20 minutes", "type": "step", "timerSeconds": 1200, "sortOrder": 7 },
    { "id": "s9", "text": "Remove lid, reduce to 450°F, bake 20-25 minutes until deep golden brown", "type": "step", "timerSeconds": 1200, "sortOrder": 8 },
    { "id": "s10", "text": "Cool on wire rack at least 1 hour before slicing", "type": "step", "timerSeconds": 3600, "sortOrder": 9 }
  ]
}

CRITICAL RULES — read every one:

1. INGREDIENTS — Every ingredient MUST include its exact quantity and unit from the recipe (e.g. "500g bread flour", "2 tsp salt", "350g water at 90°F"). NEVER output just "Bread flour" or "Water" or "Salt" without the amount. If the recipe specifies a quantity, you must include it.

2. STEPS — You MUST include EVERY step from start to finish. That means mixing, autolyse, adding starter/salt, folding, bulk fermentation, shaping, proofing, PREHEATING THE OVEN, BAKING, and cooling. A recipe without baking instructions is incomplete. Count your steps at the end — if there is no step mentioning an oven temperature and bake time, you have missed something.

3. NUMBERS — Every number from the original recipe must appear in your output: temperatures (°F or °C), times (minutes, hours), weights (g, oz, kg), percentages, counts. NEVER replace a number with a vague description. "Preheat to 450°F" not "Preheat to high heat". "Bulk ferment 4-6 hours" not "Bulk ferment until doubled".

4. EQUIPMENT — Extract equipment mentioned or implied by the recipe. Include specifics like size where given (e.g. "5-7 qt Dutch oven"). If the recipe uses weight measurements, include "Digital kitchen scale". Infer essential items from the steps (e.g. if it says "place in banneton", include banneton).

5. DO NOT SUMMARIZE OR COMBINE STEPS — If the recipe describes preheating and baking as separate actions, keep them as separate steps. If the recipe has 12 steps, your output should have approximately 12 steps.

6. TIMERS — If a step mentions a specific time duration (e.g. "30 minutes", "20 min", "1 hour", "12-16 hours"), add a "timerSeconds" field with the duration in seconds. For ranges like "20-25 minutes", use the lower number (1200). For ranges like "12-16 hours", use the lower number (43200). Omit timerSeconds for steps with no clear duration. Do NOT add timerSeconds to stretch_folds steps (they have their own built-in timers).

Rules for the "type" field:
- "stretch_folds" — stretch and folds, coil folds, or lamination
- "proof" — bulk fermentation, proofing, cold retard, or any rising/resting period
- "step" — everything else (mixing, shaping, scoring, preheating, baking, cooling)

If the recipe name isn't obvious, generate a descriptive one.`;

async function parseRecipeWithClaude(
  content: string,
  source: string,
  uid: string
): Promise<{ recipeId: string; name: string; ingredientCount: number; stepCount: number }> {
  const anthropic = getAnthropicClient();

  const truncatedContent = content.slice(0, 30000);
  logger.info("=== RECIPE PARSE INPUT ===", {
    source,
    contentLength: content.length,
    truncatedLength: truncatedContent.length,
    contentPreview: truncatedContent.slice(0, 2000),
  });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Parse this recipe:\n\n${truncatedContent}`,
      },
    ],
    system: RECIPE_PARSE_PROMPT,
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new HttpsError("internal", "Claude returned no text response.");
  }

  logger.info("=== CLAUDE RAW RESPONSE ===", {
    stopReason: message.stop_reason,
    responseLength: textBlock.text.length,
    responseText: textBlock.text.slice(0, 3000),
  });

  let parsed: {
    name: string;
    ingredients: { id: string; text: string; sortOrder: number }[];
    equipment?: { id: string; text: string; sortOrder: number }[];
    steps: { id: string; text: string; type: string; sortOrder: number; timerSeconds?: number }[];
  };

  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new HttpsError("internal", "Could not parse Claude's response as JSON.");
  }

  if (!parsed.name || !parsed.ingredients?.length || !parsed.steps?.length) {
    throw new HttpsError("internal", "Claude returned an incomplete recipe.");
  }

  // Look up owner's display name for community sharing
  let ownerName = "Anonymous Baker";
  try {
    const userDoc = await db.doc(`users/${uid}`).get();
    ownerName = userDoc.data()?.displayName || userDoc.data()?.email || ownerName;
  } catch {
    // Fall back to default
  }

  // Save to Firestore
  const recipeRef = db.collection("recipes").doc();
  await recipeRef.set({
    name: parsed.name,
    source,
    ownerId: uid,
    ownerName,
    visibility: "private",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    totalBakes: 0,
    ingredients: parsed.ingredients,
    equipment: parsed.equipment || [],
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
 * importRecipeFromPdf — Parse a PDF file into a structured recipe
 */
export const importRecipeFromPdf = onCall(
  { secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    const uid = requireAuth(request);
    const { pdfBase64, source } = request.data as { pdfBase64: string; source: string };

    if (!pdfBase64?.trim()) {
      throw new HttpsError("invalid-argument", "PDF content is required.");
    }

    // Limit to ~10MB base64 (~7.5MB file)
    if (pdfBase64.length > 10 * 1024 * 1024) {
      throw new HttpsError("invalid-argument", "PDF is too large. Maximum size is ~7.5MB.");
    }

    await checkRateLimit(uid);

    const anthropic = getAnthropicClient();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: "Parse the recipe from this PDF document.",
            },
          ],
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
      equipment?: { id: string; text: string; sortOrder: number }[];
      steps: { id: string; text: string; type: string; sortOrder: number; timerSeconds?: number }[];
    };

    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      throw new HttpsError("internal", "Could not parse Claude's response as JSON.");
    }

    if (!parsed.name || !parsed.ingredients?.length || !parsed.steps?.length) {
      throw new HttpsError("internal", "Claude returned an incomplete recipe.");
    }

    let ownerName = "Anonymous Baker";
    try {
      const userDoc = await db.doc(`users/${uid}`).get();
      ownerName = userDoc.data()?.displayName || userDoc.data()?.email || ownerName;
    } catch {
      // Fall back to default
    }

    const recipeRef = db.collection("recipes").doc();
    await recipeRef.set({
      name: parsed.name,
      source: source || "Uploaded PDF",
      ownerId: uid,
      ownerName,
      visibility: "private",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      totalBakes: 0,
      ingredients: parsed.ingredients,
      equipment: parsed.equipment || [],
      steps: parsed.steps,
    });

    return {
      recipeId: recipeRef.id,
      name: parsed.name,
      ingredientCount: parsed.ingredients.length,
      stepCount: parsed.steps.length,
    };
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

    // Try to find structured recipe data (JSON-LD) BEFORE removing scripts
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
      // Remove non-content elements before extracting text
      $("script, style, nav, header, footer, iframe, noscript, svg, [role='navigation']").remove();

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

    const extractionMethod = recipeText.startsWith("{") ? "JSON-LD" : "body-text";
    logger.info("=== URL EXTRACTION ===", {
      url,
      extractionMethod,
      htmlLength: html.length,
      extractedLength: recipeText.length,
      extractedPreview: recipeText.slice(0, 2000),
    });

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
