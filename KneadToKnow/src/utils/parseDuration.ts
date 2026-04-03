/**
 * Parse a time duration from step text and return total seconds.
 * Returns null if no parseable duration is found.
 *
 * Handles patterns like:
 *   "Rest 30 minutes"          → 1800
 *   "Bake for 20-25 minutes"   → 1200  (uses the first/lower number)
 *   "Preheat for 45 min"       → 2700
 *   "Cold proof 12-16 hours"   → 43200
 *   "Autolyse 1 hour"          → 3600
 *   "Rest 1.5 hours"           → 5400
 *   "Bake 20 min, then 25 min" → 1200  (first duration only)
 */

const DURATION_PATTERN =
  /(\d+(?:\.\d+)?)\s*(?:-\s*\d+(?:\.\d+)?\s*)?(minutes?|mins?|hours?|hrs?|seconds?|secs?)\b/i;

export function parseDuration(text: string): number | null {
  const match = text.match(DURATION_PATTERN);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith('sec')) return Math.round(value);
  if (unit.startsWith('min')) return Math.round(value * 60);
  if (unit.startsWith('hr') || unit.startsWith('hour')) return Math.round(value * 3600);

  return null;
}
