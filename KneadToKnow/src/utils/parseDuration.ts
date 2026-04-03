/**
 * Parse a time duration from step text and return total seconds.
 * Returns null if no parseable duration is found.
 * * Handles patterns like:
 * "Rest 30 minutes"          → 1800
 * "Bake for 20-25 minutes"   → 1200  (uses lower bound)
 * "Rest 1 to 2 hours"        → 3600  (uses lower bound)
 * "Cold proof 1/2 hour"      → 1800  (handles fractions)
 * "Rest 1 1/2 hrs"           → 5400  (handles mixed fractions)
 * "Autolyse 45m"             → 2700  (handles single letters)
 */

const DURATION_PATTERN =
  /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(?:(?:-|to|or)\s*(?:(?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*)?(minutes?|mins?|m\b|hours?|hrs?|h\b|seconds?|secs?|s\b)/i;

export function parseDuration(text: string): number | null {
  const match = text.match(DURATION_PATTERN);
  if (!match) return null;

  let value = 0;
  const numStr = match[1].trim();

  // 1. Handle fractions and mixed fractions
  if (numStr.includes('/')) {
    const parts = numStr.split(' ');
    if (parts.length === 2) {
      // e.g., "1 1/2"
      const [whole, frac] = parts;
      const [n, d] = frac.split('/');
      value = parseInt(whole, 10) + (parseInt(n, 10) / parseInt(d, 10));
    } else {
      // e.g., "1/2"
      const [n, d] = numStr.split('/');
      value = parseInt(n, 10) / parseInt(d, 10);
    }
  } else {
    // 2. Handle standard decimals/whole numbers
    value = parseFloat(numStr);
  }

  const unit = match[2].toLowerCase();

  // 3. Convert to seconds
  if (unit.startsWith('sec') || unit === 's') return Math.round(value);
  if (unit.startsWith('min') || unit === 'm') return Math.round(value * 60);
  if (unit.startsWith('hr') || unit.startsWith('hour') || unit === 'h') return Math.round(value * 3600);

  return null;
}
