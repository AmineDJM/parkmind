import type { CityRules, ZoneConfig } from './types';

/** Generate the 20 Paris arrondissements as parking zones. */
function parisArrondissements(): ZoneConfig[] {
  const zones: ZoneConfig[] = [];
  for (let n = 1; n <= 20; n++) {
    const ordinal = n === 1 ? '1er' : `${n}e`;
    const postal = `750${String(n).padStart(2, '0')}`;
    // The 16th arrondissement is the only one with two postal codes.
    const aliases = [String(n), `${n}e`, ordinal, postal];
    if (n === 16) aliases.push('75116');
    zones.push({
      code: `paris-${n}`,
      name: `Paris ${ordinal}`,
      // Inner arrondissements are heavily rotating; outer ones more residential.
      kind: n <= 11 ? 'ROTATING' : 'RESIDENTIAL',
      isPaid: true,
      aliases,
    });
  }
  return zones;
}

export const paris: CityRules = {
  slug: 'paris',
  name: 'Paris',
  country: 'FR',
  timezone: 'Europe/Paris',
  currency: 'EUR',
  status: 'LIVE',
  operators: ['PAYBYPHONE', 'FLOWBIRD', 'MOCK'],
  calendar: {
    // Paid Monday–Saturday, free on Sundays.
    paidDaysOfWeek: [1, 2, 3, 4, 5, 6],
    paidHours: { start: '09:00', end: '20:00' },
    observesFrenchPublicHolidays: true,
    // Residents historically benefit from free parking in August (configurable).
    freeMonthsForResidents: [8],
  },
  // Full paid window: 09:00 → 20:00.
  maxDurationMinutes: 660,
  zones: parisArrondissements(),
  rights: [
    {
      type: 'RESIDENT',
      label: 'Tarif résident',
      // Flat resident day-rate (approximation of Paris resident pricing).
      pricing: { kind: 'FLAT_DAY', amountCents: 150 },
      maxDurationMinutes: 660,
      requiresValidRight: true,
      tariffCode: 'PAR-RES-DAY',
      notes: 'Carte de stationnement résidentiel valide requise.',
    },
    {
      type: 'PROFESSIONAL',
      label: 'Tarif professionnel sédentaire',
      pricing: { kind: 'FLAT_DAY', amountCents: 300 },
      maxDurationMinutes: 660,
      requiresValidRight: true,
      tariffCode: 'PAR-PRO-DAY',
      notes: 'Carte professionnelle sédentaire requise.',
    },
    {
      type: 'OTHER',
      label: 'Tarif rotatif (visiteur)',
      pricing: { kind: 'HOURLY', perHourCents: 400, maxDailyCents: 5000 },
      maxDurationMinutes: 360,
      requiresValidRight: false,
      tariffCode: 'PAR-VIS-H',
      notes: 'Stationnement rotatif limité à 6 h.',
    },
  ],
  constraints: [
    'Stationnement payant du lundi au samedi, 9 h – 20 h.',
    'Gratuit les dimanches et jours fériés.',
    'Le stationnement rotatif est limité à 6 heures consécutives.',
  ],
  disclaimer:
    "Règles configurables et simplifiées à des fins de démonstration. Les règles de la Ville de Paris et de l'opérateur font foi.",
};
