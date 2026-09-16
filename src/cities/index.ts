import type { CityRules, CityRightConfig, ZoneConfig } from './types';
import type { RightType } from '@/domain/enums';
import { paris } from './paris';
import { bordeaux } from './bordeaux';
import { lyon } from './lyon';
import { marseille } from './marseille';
import { lille } from './lille';
import { toulouse } from './toulouse';

export * from './types';
export { frenchPublicHolidays, isFrenchPublicHoliday } from './holidays';

/**
 * The city registry. This is the single source of truth for parking rules.
 * Add a city here and it flows through the engine, onboarding, seed and admin.
 */
export const CITY_RULES: Record<string, CityRules> = {
  paris,
  bordeaux,
  lyon,
  marseille,
  lille,
  toulouse,
};

export function listCityRules(): CityRules[] {
  return Object.values(CITY_RULES);
}

export function getCityRules(slug: string | null | undefined): CityRules | undefined {
  if (!slug) return undefined;
  return CITY_RULES[slug.toLowerCase()];
}

/** Resolve a zone by its code or any of its aliases (case-insensitive). */
export function findZoneInCity(
  city: CityRules,
  codeOrAlias: string,
): ZoneConfig | undefined {
  const needle = codeOrAlias.trim().toLowerCase();
  return city.zones.find((z) => {
    if (z.code.toLowerCase() === needle) return true;
    if (z.name.toLowerCase() === needle) return true;
    return (z.aliases ?? []).some((a) => a.toLowerCase() === needle);
  });
}

export function getRightConfig(
  city: CityRules,
  type: RightType,
): CityRightConfig | undefined {
  return city.rights.find((r) => r.type === type);
}

export type { CityRules, CityRightConfig, ZoneConfig };
