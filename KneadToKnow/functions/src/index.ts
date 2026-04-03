import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import {getStorage} from "firebase-admin/storage";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import Anthropic from "@anthropic-ai/sdk";

initializeApp();

const SERVICE_ACCOUNT =
  "knead-to-know-fn@kneadtoknow-c4913.iam.gserviceaccount.com";

setGlobalOptions({
  maxInstances: 10,
  serviceAccount: SERVICE_ACCOUNT,
});

const db = getFirestore();
const authAdmin = getAuth();
const storage = getStorage();
const secretsMgr = new SecretManagerServiceClient();

// ─── Secret Manager Helpers ───

function getProjectId(): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (!projectId) {
    throw new HttpsError("internal", "Could not determine GCP project ID.");
  }
  return projectId;
}

async function storeSecret(uid: string, token: string): Promise<void> {
  const projectId = getProjectId();
  const secretId = `ha-token-${uid}`;
  const parent = `projects/${projectId}`;
  const secretName = `${parent}/secrets/${secretId}`;

  try {
    await secretsMgr.getSecret({name: secretName});
    await secretsMgr.addSecretVersion({
      parent: secretName,
      payload: {data: Buffer.from(token, "utf8")},
    });
  } catch (err: unknown) {
    const grpcErr = err as {code?: number};
    if (grpcErr.code === 5) {
      await secretsMgr.createSecret({
        parent,
        secretId,
        secret: {replication: {automatic: {}}},
      });
      await secretsMgr.addSecretVersion({
        parent: secretName,
        payload: {data: Buffer.from(token, "utf8")},
      });
    } else {
      throw err;
    }
  }
}

async function getSecret(uid: string): Promise<string> {
  const projectId = getProjectId();
  const secretName =
    `projects/${projectId}/secrets/ha-token-${uid}/versions/latest`;

  const [version] = await secretsMgr.accessSecretVersion({name: secretName});
  const payload = version.payload?.data;
  if (!payload) {
    throw new HttpsError(
      "not-found",
      "No Home Assistant token found. Go to Settings to connect."
    );
  }
  return typeof payload === "string"
    ? payload
    : Buffer.from(payload).toString("utf8");
}

async function deleteSecretIfExists(uid: string): Promise<void> {
  const projectId = getProjectId();
  const secretName =
    `projects/${projectId}/secrets/ha-token-${uid}`;

  try {
    await secretsMgr.deleteSecret({name: secretName});
  } catch (err: unknown) {
    const grpcErr = err as {code?: number};
    if (grpcErr.code !== 5) throw err; // Ignore NOT_FOUND
  }
}

// ─── Home Assistant Helpers ───

async function fetchHAState(
  url: string,
  token: string,
  entityId: string
): Promise<{tempF: number; sensorName: string; unit: string}> {
  const response = await fetch(`${url}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new HttpsError("unauthenticated", "Invalid Home Assistant token.");
    }
    if (response.status === 404) {
      throw new HttpsError(
        "not-found",
        `Sensor "${entityId}" not found in Home Assistant.`
      );
    }
    throw new HttpsError(
      "unavailable",
      `Home Assistant returned HTTP ${response.status}.`
    );
  }

  const data = await response.json();
  let tempF = parseFloat(data.state);
  if (isNaN(tempF)) {
    throw new HttpsError(
      "failed-precondition",
      `Sensor returned invalid value: "${data.state}"`
    );
  }

  const unit = data.attributes?.unit_of_measurement || "";
  if (unit === "°C" || unit === "C") {
    tempF = Math.round((tempF * 9 / 5 + 32) * 10) / 10;
  }

  const sensorName = data.attributes?.friendly_name || entityId;
  return {tempF, sensorName, unit};
}

// ─── Recipe Import Helpers ───

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new HttpsError(
      "failed-precondition",
      "Recipe import is not configured. ANTHROPIC_API_KEY is missing."
    );
  }
  return new Anthropic({apiKey});
}

const RECIPE_PARSE_PROMPT = `Parse this recipe into structured JSON. Return ONLY valid JSON with this exact shape:
{
  "name": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": [
    {"text": "step description", "type": "step"},
    {"text": "stretch and fold description", "type": "stretch_folds"},
    {"text": "proof/bulk ferment description", "type": "proof"}
  ],
  "equipment": ["equipment 1", "equipment 2"]
}

Rules:
- "type" is "stretch_folds" if the step involves stretch and folds
- "type" is "proof" if the step involves proofing, bulk fermentation, or bulk rise
- "type" is "step" for all other steps
- Extract equipment if mentioned (ovens, bannetons, Dutch ovens, etc.)
- Keep ingredient text exactly as written (amounts + descriptions)
- Keep step text clear and actionable
- If the recipe name isn't obvious, infer it from the content`;

interface ParsedRecipe {
  name: string;
  ingredients: string[];
  steps: Array<{text: string; type: "step" | "stretch_folds" | "proof"}>;
  equipment?: string[];
}

async function parseRecipeWithClaude(
  content: string
): Promise<ParsedRecipe> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `${RECIPE_PARSE_PROMPT}\n\nRecipe content:\n${content}`,
    }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new HttpsError("internal", "Failed to parse recipe from AI response.");
  }

  try {
    return JSON.parse(jsonMatch[1]) as ParsedRecipe;
  } catch {
    throw new HttpsError("internal", "AI returned invalid JSON.");
  }
}

async function saveImportedRecipe(
  uid: string,
  parsed: ParsedRecipe,
  source: string
): Promise<{recipeId: string; name: string; ingredientCount: number; stepCount: number}> {
  const ingredients = parsed.ingredients.map((text, i) => ({
    id: `i${i + 1}`,
    text,
    sortOrder: i,
  }));

  const steps = parsed.steps.map((step, i) => ({
    id: `s${i + 1}`,
    text: step.text,
    type: step.type,
    sortOrder: i,
  }));

  const recipeData: Record<string, unknown> = {
    name: parsed.name,
    source,
    ingredients,
    steps,
    ownerId: uid,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (parsed.equipment && parsed.equipment.length > 0) {
    recipeData.equipment = parsed.equipment.map((text, i) => ({
      id: `e${i + 1}`,
      text,
      sortOrder: i,
    }));
  }

  const docRef = await db.collection("recipes").add(recipeData);

  return {
    recipeId: docRef.id,
    name: parsed.name,
    ingredientCount: ingredients.length,
    stepCount: steps.length,
  };
}

// ─── Rate Limiting Helper ───

async function checkRateLimit(uid: string, limit: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const counterRef = db.doc(`rateLimits/${uid}_import_${today}`);
  const counterDoc = await counterRef.get();
  const count = counterDoc.exists ? (counterDoc.data()?.count || 0) : 0;

  if (count >= limit) {
    throw new HttpsError(
      "resource-exhausted",
      `Import limit reached (${limit}/day). Try again tomorrow.`
    );
  }

  await counterRef.set({count: count + 1, updatedAt: FieldValue.serverTimestamp()});
}

// ═══════════════════════════════════════════
// Cloud Functions
// ═══════════════════════════════════════════

// ─── Home Assistant ───

/**
 * Save Home Assistant configuration.
 * Tests the connection first, stores the token in Secret Manager,
 * and saves non-sensitive config (url, entityId) in Firestore.
 */
export const saveHAConfig = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;
  const {url, token, entityId} = request.data as {
    url: string;
    token: string;
    entityId: string;
  };

  if (!url || !token || !entityId) {
    throw new HttpsError(
      "invalid-argument",
      "url, token, and entityId are required."
    );
  }

  await fetchHAState(url, token, entityId);
  await storeSecret(uid, token);

  await db.doc(`users/${uid}/config/homeAssistant`).set({
    url,
    entityId,
    updatedAt: new Date(),
  });

  return {success: true};
});

/**
 * Get temperature from the user's Home Assistant instance.
 */
export const getTemperatureFromHA = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;
  const configDoc = await db.doc(`users/${uid}/config/homeAssistant`).get();
  if (!configDoc.exists) {
    throw new HttpsError(
      "not-found",
      "Home Assistant not configured. Go to Settings to connect."
    );
  }

  const {url, entityId} = configDoc.data() as {url: string; entityId: string};
  const token = await getSecret(uid);

  return await fetchHAState(url, token, entityId);
});

// ─── Recipe Import ───

/**
 * Import a recipe by parsing raw text content with Claude.
 * Rate limited to 10 imports/day per user.
 */
export const importRecipe = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;
  const {content, source} = request.data as {content: string; source: string};

  if (!content || !content.trim()) {
    throw new HttpsError("invalid-argument", "Recipe content is required.");
  }

  await checkRateLimit(uid, 10);

  const parsed = await parseRecipeWithClaude(content);
  return await saveImportedRecipe(uid, parsed, source || "Pasted text");
});

/**
 * Import a recipe from a URL. Fetches the page, strips HTML, parses with Claude.
 */
export const importRecipeFromUrl = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;
  const {url} = request.data as {url: string};

  if (!url || !url.trim()) {
    throw new HttpsError("invalid-argument", "URL is required.");
  }

  await checkRateLimit(uid, 10);

  // Fetch the page
  const response = await fetch(url, {
    headers: {"User-Agent": "KneadToKnow/1.0 (recipe importer)"},
  });

  if (!response.ok) {
    throw new HttpsError(
      "unavailable",
      `Could not fetch URL (HTTP ${response.status}).`
    );
  }

  const html = await response.text();

  // Strip HTML tags to get readable text
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000); // Limit to avoid huge Claude requests

  const parsed = await parseRecipeWithClaude(text);
  return await saveImportedRecipe(uid, parsed, url);
});

/**
 * Import a recipe from a PDF file (sent as base64).
 * Uses Claude's document support to extract recipe content.
 */
export const importRecipeFromPdf = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;
  const {pdfBase64, source} = request.data as {
    pdfBase64: string;
    source?: string;
  };

  if (!pdfBase64 || !pdfBase64.trim()) {
    throw new HttpsError("invalid-argument", "PDF content is required.");
  }

  await checkRateLimit(uid, 10);

  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{
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
          text: RECIPE_PARSE_PROMPT,
        },
      ],
    }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new HttpsError("internal", "Failed to parse recipe from AI response.");
  }

  let parsed: ParsedRecipe;
  try {
    parsed = JSON.parse(jsonMatch[1]) as ParsedRecipe;
  } catch {
    throw new HttpsError("internal", "AI returned invalid JSON.");
  }

  return await saveImportedRecipe(uid, parsed, source || "Uploaded PDF");
});

// ─── Recipe Sharing ───

/**
 * Toggle a recipe between private and shared visibility.
 * Only the recipe owner can call this.
 */
export const toggleRecipeVisibility = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;
  const {recipeId} = request.data as {recipeId: string};

  if (!recipeId) {
    throw new HttpsError("invalid-argument", "recipeId is required.");
  }

  const recipeRef = db.doc(`recipes/${recipeId}`);
  const recipeDoc = await recipeRef.get();

  if (!recipeDoc.exists) {
    throw new HttpsError("not-found", "Recipe not found.");
  }

  const data = recipeDoc.data()!;
  if (data.ownerId !== uid) {
    throw new HttpsError("permission-denied", "You can only share your own recipes.");
  }

  const currentVisibility = data.visibility || "private";
  const newVisibility = currentVisibility === "private" ? "shared" : "private";

  await recipeRef.update({visibility: newVisibility});

  return {visibility: newVisibility};
});

// ─── Account Deletion ───

/**
 * Permanently delete the user's account and all their data.
 * Deletes: recipes, bake logs, photos, HA secrets, user profile, auth account.
 */
export const deleteUserAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const uid = request.auth.uid;

  // 1. Delete all user's bake logs
  const bakesSnap = await db.collection("bakeLogs")
    .where("ownerId", "==", uid).get();
  const bakeDeletes = bakesSnap.docs.map((doc) => doc.ref.delete());
  await Promise.all(bakeDeletes);

  // 2. Delete all user's recipes
  const recipesSnap = await db.collection("recipes")
    .where("ownerId", "==", uid).get();
  const recipeDeletes = recipesSnap.docs.map((doc) => doc.ref.delete());
  await Promise.all(recipeDeletes);

  // 3. Delete user's photos from Storage
  try {
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({prefix: `bake-photos/${uid}/`});
    const fileDeletes = files.map((file) => file.delete());
    await Promise.all(fileDeletes);
  } catch {
    // No photos — that's fine
  }

  // 4. Delete HA secret from Secret Manager if it exists
  await deleteSecretIfExists(uid);

  // 5. Delete user config subcollection
  try {
    const configSnap = await db.collection(`users/${uid}/config`).get();
    const configDeletes = configSnap.docs.map((doc) => doc.ref.delete());
    await Promise.all(configDeletes);
  } catch {
    // No config docs — that's fine
  }

  // 6. Delete user document
  try {
    await db.doc(`users/${uid}`).delete();
  } catch {
    // No user doc — that's fine
  }

  // 7. Delete Firebase Auth account (must be last)
  await authAdmin.deleteUser(uid);

  return {success: true};
});
