import type { CityRightConfig } from '@/cities/types';

/**
 * Compute the amount (integer cents) for a given right/tariff and duration.
 * Pure and deterministic.
 */
export function computeAmountCents(
  right: CityRightConfig,
  durationMinutes: number,
): number {
  const pricing = right.pricing;
  if (pricing.kind === 'FLAT_DAY') {
    return pricing.amountCents;
  }
  // HOURLY: bill per started hour, capped at an optional daily maximum.
  const hours = Math.max(1, Math.ceil(durationMinutes / 60));
  const raw = hours * pricing.perHourCents;
  if (pricing.maxDailyCents != null) {
    return Math.min(raw, pricing.maxDailyCents);
  }
  return raw;
}
