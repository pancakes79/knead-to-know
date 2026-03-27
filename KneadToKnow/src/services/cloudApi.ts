/**
 * Client-side API layer for Knead to Know v2
 *
 * All sensitive operations go through Cloud Functions.
 * No API keys or third-party credentials in the client app.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';

const functions = getFunctions(app);

// ─── Types ───

interface ImportedRecipe {
  recipeId: string;
  name: string;
  ingredientCount: number;
  stepCount: number;
}

interface HATemperatureResult {
  tempF: number;
  sensorName: string;
  unit: string;
}

// ─── Recipe Import ───

/**
 * Import a recipe by parsing raw text content with Claude (server-side).
 * Rate limited to 10 imports/day per user.
 */
export async function importRecipeFromText(
  content: string,
  source: string = 'Pasted text'
): Promise<ImportedRecipe> {
  const fn = httpsCallable<{ content: string; source: string }, ImportedRecipe>(
    functions,
    'importRecipe'
  );
  const result = await fn({ content, source });
  return result.data;
}

/**
 * Import a recipe from a URL. The server fetches the page,
 * strips HTML, and parses with Claude.
 */
export async function importRecipeFromUrl(
  url: string
): Promise<ImportedRecipe> {
  const fn = httpsCallable<{ url: string }, ImportedRecipe>(
    functions,
    'importRecipeFromUrl'
  );
  const result = await fn({ url });
  return result.data;
}

// ─── Home Assistant ───

/**
 * Get temperature from the user's Home Assistant instance.
 * HA credentials are stored server-side in Firestore — never on the client.
 */
export async function getHATemperature(): Promise<HATemperatureResult> {
  const fn = httpsCallable<void, HATemperatureResult>(
    functions,
    'getTemperatureFromHA'
  );
  const result = await fn();
  return result.data;
}

/**
 * Save Home Assistant configuration. The server tests the connection
 * before saving, and stores credentials in Firestore (not on the client).
 */
export async function saveHAConfiguration(config: {
  url: string;
  token: string;
  entityId: string;
}): Promise<void> {
  const fn = httpsCallable<typeof config, { success: boolean }>(
    functions,
    'saveHAConfig'
  );
  await fn(config);
}

// ─── Recipe Sharing ───

/**
 * Toggle a recipe between private and shared visibility.
 * Only the recipe owner can call this.
 */
export async function toggleRecipeSharing(
  recipeId: string
): Promise<{ visibility: 'private' | 'shared' }> {
  const fn = httpsCallable<{ recipeId: string }, { visibility: 'private' | 'shared' }>(
    functions,
    'toggleRecipeVisibility'
  );
  const result = await fn({ recipeId });
  return result.data;
}

// ─── Account Deletion ───

/**
 * Permanently delete the user's account and all their data.
 * This deletes: recipes, bake logs, photos, user profile, and auth account.
 */
export async function deleteAccount(): Promise<void> {
  const fn = httpsCallable<void, { success: boolean }>(
    functions,
    'deleteUserAccount'
  );
  await fn();
}
