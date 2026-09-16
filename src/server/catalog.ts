import 'server-only';
import type { City, ParkingProvider, ParkingZone } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getCityRules, findZoneInCity } from '@/cities';
import { PROVIDER_CATALOG } from '@/providers';
import type { ProviderKey, ZoneKind } from '@/domain/enums';

/**
 * Self-healing catalog helpers: they upsert City / ParkingZone / ParkingProvider
 * rows from the code config so the app works even before an explicit seed, and
 * stays in sync when the config evolves.
 */

export async function ensureCity(slug: string): Promise<City> {
  const rules = getCityRules(slug);
  if (!rules) throw new Error(`Ville inconnue : ${slug}`);
  return prisma.city.upsert({
    where: { slug: rules.slug },
    update: { name: rules.name, timezone: rules.timezone, currency: rules.currency },
    create: {
      slug: rules.slug,
      name: rules.name,
      country: rules.country,
      timezone: rules.timezone,
      currency: rules.currency,
    },
  });
}

export async function ensureZone(
  citySlug: string,
  zoneCode: string,
): Promise<{ city: City; zone: ParkingZone }> {
  const rules = getCityRules(citySlug);
  if (!rules) throw new Error(`Ville inconnue : ${citySlug}`);
  const zoneCfg = findZoneInCity(rules, zoneCode);
  if (!zoneCfg) throw new Error(`Zone inconnue : ${zoneCode}`);
  const city = await ensureCity(citySlug);
  const zone = await prisma.parkingZone.upsert({
    where: { cityId_code: { cityId: city.id, code: zoneCfg.code } },
    update: { name: zoneCfg.name, kind: zoneCfg.kind as ZoneKind, isPaid: zoneCfg.isPaid },
    create: {
      cityId: city.id,
      code: zoneCfg.code,
      name: zoneCfg.name,
      kind: zoneCfg.kind as ZoneKind,
      isPaid: zoneCfg.isPaid,
    },
  });
  return { city, zone };
}

export async function ensureProviderByKey(key: ProviderKey): Promise<ParkingProvider> {
  const entry = PROVIDER_CATALOG.find((p) => p.key === key);
  if (!entry) throw new Error(`Opérateur inconnu : ${key}`);
  return prisma.parkingProvider.upsert({
    where: { key: entry.key },
    update: {
      name: entry.name,
      isImplemented: entry.isImplemented,
      health: entry.health,
      website: entry.website ?? null,
      notes: entry.notes ?? null,
    },
    create: {
      key: entry.key,
      name: entry.name,
      isImplemented: entry.isImplemented,
      health: entry.health,
      website: entry.website ?? null,
      notes: entry.notes ?? null,
    },
  });
}
