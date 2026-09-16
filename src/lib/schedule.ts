import { getLocalParts, hhmmToMinutes } from './time';

const DAY_NAMES_FR = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

function maxHHmm(a: string, b: string): string {
  return hhmmToMinutes(a) >= hhmmToMinutes(b) ? a : b;
}

/**
 * Human description of the next planned activation, honoring the rule days, the
 * rule start time and the city's paid-hours start (whichever is later).
 */
export function describeNextRun(
  daysOfWeek: number[],
  ruleStart: string,
  paidStart: string,
  timezone: string,
  now: Date = new Date(),
): string {
  if (daysOfWeek.length === 0) return 'Aucun jour programmé';
  const effectiveStart = maxHHmm(ruleStart, paidStart);
  const local = getLocalParts(now, timezone);
  const nowMin = local.hours * 60 + local.minutes;
  const startMin = hhmmToMinutes(effectiveStart);

  // Today, still before the window?
  if (daysOfWeek.includes(local.isoDayOfWeek) && nowMin < startMin) {
    return `aujourd'hui à ${effectiveStart}`;
  }
  // Next matching day within the coming week.
  for (let i = 1; i <= 7; i++) {
    const day = ((local.isoDayOfWeek - 1 + i) % 7) + 1;
    if (daysOfWeek.includes(day)) {
      const label = i === 1 ? 'demain' : DAY_NAMES_FR[day];
      return `${label} à ${effectiveStart}`;
    }
  }
  return `à ${effectiveStart}`;
}
