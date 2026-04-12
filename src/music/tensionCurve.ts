/**
 * Tension curve: maps song progress (0-1) to a tension value.
 *
 * Gaussian peak at 65% of the song (climax in the back half),
 * with a baseline so the beginning/end are quiet but not silent.
 *
 * Output range: BASELINE .. BASELINE + STRENGTH (0.3 .. 0.7)
 */

const MU = 0.65 // climax position (65% through the song)
const SIGMA = 0.15 // width of the peak
const BASELINE = 0.3 // minimum tension (beginning/end)
const STRENGTH = 0.4 // how much the peak adds

export function tension(progress: number): number {
  const exponent = -((progress - MU) ** 2) / (2 * SIGMA ** 2)
  return BASELINE + STRENGTH * Math.exp(exponent)
}
