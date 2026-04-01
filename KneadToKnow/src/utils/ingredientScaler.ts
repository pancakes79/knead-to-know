const QUANTITY_REGEX = /^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb|lbs|cups?|tbsp|tsp)\b/i;
const FRACTION_REGEX = /^(\d+)\/(\d+)\s*(g|kg|ml|l|oz|lb|lbs|cups?|tbsp|tsp)\b/i;

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, '');
}

export function scaleIngredientText(text: string, multiplier: number): string {
  if (multiplier === 1) return text;

  const fractionMatch = text.match(FRACTION_REGEX);
  if (fractionMatch) {
    const value = (parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10)) * multiplier;
    const unit = fractionMatch[3];
    const rest = text.slice(fractionMatch[0].length);
    return `${formatNumber(value)}${unit}${rest}`;
  }

  const match = text.match(QUANTITY_REGEX);
  if (!match) return text;

  const value = parseFloat(match[1]) * multiplier;
  const unit = match[2];
  const rest = text.slice(match[0].length);
  return `${formatNumber(value)}${unit}${rest}`;
}
