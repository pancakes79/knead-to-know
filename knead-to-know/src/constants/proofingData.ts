// Based on The Sourdough Journey Dough Temping Guide © 2024
export const PROOFING_CHART = [
  { tempF: 80, tempC: 27, hours: 5.5, rise: 30 },
  { tempF: 79, tempC: 26, hours: 5.5, rise: 30 },
  { tempF: 78, tempC: 25.5, hours: 6, rise: 40 },
  { tempF: 77, tempC: 25, hours: 6, rise: 40 },
  { tempF: 76, tempC: 24.5, hours: 7, rise: 50 },
  { tempF: 75, tempC: 24, hours: 7, rise: 50 },
  { tempF: 74, tempC: 23, hours: 8, rise: 55 },
  { tempF: 73, tempC: 22.5, hours: 9, rise: 60 },
  { tempF: 72, tempC: 22, hours: 10, rise: 65 },
  { tempF: 71, tempC: 21.5, hours: 11, rise: 70 },
  { tempF: 70, tempC: 21, hours: 12, rise: 75 },
  { tempF: 69, tempC: 20.5, hours: 13, rise: 80 },
  { tempF: 68, tempC: 20, hours: 14, rise: 85 },
  { tempF: 67, tempC: 19.5, hours: 15, rise: 90 },
  { tempF: 66, tempC: 19, hours: 16, rise: 95 },
  { tempF: 65, tempC: 18, hours: 17, rise: 100 },
];

export interface ProofingEstimate {
  hours: number;
  rise: number;
}

/**
 * Get estimated proofing time and target rise percentage for a given temperature.
 * Uses linear interpolation between chart data points.
 */
export function getProofingEstimate(tempF: number): ProofingEstimate {
  // Clamp to chart boundaries
  if (tempF >= 80) return { hours: 5.5, rise: 30 };
  if (tempF <= 65) return { hours: 17, rise: 100 };

  // Find the two bracketing data points
  // Chart is sorted descending by tempF
  let upper = PROOFING_CHART[0];
  let lower = PROOFING_CHART[PROOFING_CHART.length - 1];

  for (let i = 0; i < PROOFING_CHART.length - 1; i++) {
    if (PROOFING_CHART[i].tempF >= tempF && PROOFING_CHART[i + 1].tempF <= tempF) {
      upper = PROOFING_CHART[i];
      lower = PROOFING_CHART[i + 1];
      break;
    }
  }

  // Exact match
  if (upper.tempF === lower.tempF) {
    return { hours: upper.hours, rise: upper.rise };
  }

  // Linear interpolation
  const ratio = (upper.tempF - tempF) / (upper.tempF - lower.tempF);
  return {
    hours: Math.round((upper.hours + ratio * (lower.hours - upper.hours)) * 10) / 10,
    rise: Math.round(upper.rise + ratio * (lower.rise - upper.rise)),
  };
}

/**
 * Convert Celsius to Fahrenheit
 */
export function cToF(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32);
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fToC(fahrenheit: number): number {
  return Math.round((fahrenheit - 32) * 5 / 9 * 10) / 10;
}
