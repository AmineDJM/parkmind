import { listCityRules } from '@/cities';
import type { ProviderKey, RightType } from '@/domain/enums';

export interface CityOptionData {
  slug: string;
  name: string;
  status: 'LIVE' | 'BETA';
  zones: { code: string; name: string }[];
  operators: ProviderKey[];
  rights: { type: RightType; label: string }[];
}

/** Serializable city config for client forms (onboarding, automations, rights). */
export function cityOptions(): CityOptionData[] {
  return listCityRules().map((c) => ({
    slug: c.slug,
    name: c.name,
    status: c.status,
    zones: c.zones.map((z) => ({ code: z.code, name: z.name })),
    operators: c.operators,
    rights: c.rights.map((r) => ({ type: r.type, label: r.label })),
  }));
}
