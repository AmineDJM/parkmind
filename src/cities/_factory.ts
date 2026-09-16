import type { CityRules, CityRightConfig, ZoneConfig } from './types';
import type { ProviderKey } from '@/domain/enums';

/**
 * Helper to declare additional French cities with sensible defaults.
 * Cities ship as BETA until their rules & operator integrations are confirmed.
 */
export function makeFrenchCity(params: {
  slug: string;
  name: string;
  operators: ProviderKey[];
  zones: Array<Omit<ZoneConfig, 'kind' | 'isPaid'> & Partial<Pick<ZoneConfig, 'kind' | 'isPaid'>>>;
  paidHours?: { start: string; end: string };
  residentFlatCents?: number;
  professionalFlatCents?: number;
  visitorPerHourCents?: number;
  constraints?: string[];
}): CityRules {
  const paidHours = params.paidHours ?? { start: '09:00', end: '19:00' };
  const rights: CityRightConfig[] = [
    {
      type: 'RESIDENT',
      label: 'Tarif résident',
      pricing: { kind: 'FLAT_DAY', amountCents: params.residentFlatCents ?? 100 },
      maxDurationMinutes: 600,
      requiresValidRight: true,
      tariffCode: `${params.slug.toUpperCase().slice(0, 3)}-RES-DAY`,
    },
    {
      type: 'PROFESSIONAL',
      label: 'Tarif professionnel',
      pricing: { kind: 'FLAT_DAY', amountCents: params.professionalFlatCents ?? 250 },
      maxDurationMinutes: 600,
      requiresValidRight: true,
      tariffCode: `${params.slug.toUpperCase().slice(0, 3)}-PRO-DAY`,
    },
    {
      type: 'OTHER',
      label: 'Tarif rotatif (visiteur)',
      pricing: { kind: 'HOURLY', perHourCents: params.visitorPerHourCents ?? 250, maxDailyCents: 3000 },
      maxDurationMinutes: 300,
      requiresValidRight: false,
      tariffCode: `${params.slug.toUpperCase().slice(0, 3)}-VIS-H`,
    },
  ];

  return {
    slug: params.slug,
    name: params.name,
    country: 'FR',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    status: 'BETA',
    operators: params.operators,
    calendar: {
      paidDaysOfWeek: [1, 2, 3, 4, 5, 6],
      paidHours,
      observesFrenchPublicHolidays: true,
    },
    maxDurationMinutes: 600,
    zones: params.zones.map((z) => ({
      kind: z.kind ?? 'MIXED',
      isPaid: z.isPaid ?? true,
      ...z,
    })),
    rights,
    constraints: params.constraints ?? [
      'Stationnement payant du lundi au samedi.',
      'Gratuit les dimanches et jours fériés.',
    ],
    disclaimer:
      "Ville en bêta : règles configurables et simplifiées. Les règles municipales et opérateur font foi.",
  };
}
