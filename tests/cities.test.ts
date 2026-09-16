import { describe, it, expect } from 'vitest';
import {
  CITY_RULES,
  listCityRules,
  getCityRules,
  findZoneInCity,
  getRightConfig,
} from '@/cities';
import { frenchPublicHolidays, isFrenchPublicHoliday } from '@/cities/holidays';
import { computeAmountCents } from '@/engine';

describe('City rules registry', () => {
  it('exposes all target cities', () => {
    const slugs = listCityRules().map((c) => c.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        'paris',
        'bordeaux',
        'lyon',
        'marseille',
        'lille',
        'toulouse',
      ]),
    );
  });

  it('every city has zones, rights and a valid calendar', () => {
    for (const city of listCityRules()) {
      expect(city.zones.length).toBeGreaterThan(0);
      expect(city.rights.length).toBeGreaterThan(0);
      expect(city.calendar.paidDaysOfWeek.length).toBeGreaterThan(0);
      // A resident and a visitor tariff at minimum.
      expect(getRightConfig(city, 'RESIDENT')).toBeDefined();
      expect(getRightConfig(city, 'OTHER')).toBeDefined();
    }
  });

  it('resolves a Paris zone by alias', () => {
    const paris = getCityRules('paris')!;
    expect(findZoneInCity(paris, '16')?.code).toBe('paris-16');
    expect(findZoneInCity(paris, '75116')?.code).toBe('paris-16');
    expect(findZoneInCity(paris, 'Paris 16e')?.code).toBe('paris-16');
    expect(findZoneInCity(paris, 'unknown')).toBeUndefined();
  });

  it('Paris has 20 arrondissement zones', () => {
    expect(CITY_RULES.paris!.zones.length).toBe(20);
  });
});

describe('French public holidays', () => {
  it('includes fixed holidays', () => {
    expect(isFrenchPublicHoliday('2026-01-01')).toBe(true);
    expect(isFrenchPublicHoliday('2026-07-14')).toBe(true);
    expect(isFrenchPublicHoliday('2026-12-25')).toBe(true);
  });

  it('computes Easter-derived movable feasts (2026)', () => {
    // Easter 2026 = 5 April → Easter Monday 6 April, Ascension 14 May,
    // Whit Monday 25 May.
    const h = frenchPublicHolidays(2026);
    expect(h.has('2026-04-06')).toBe(true);
    expect(h.has('2026-05-14')).toBe(true);
    expect(h.has('2026-05-25')).toBe(true);
  });

  it('a normal weekday is not a holiday', () => {
    expect(isFrenchPublicHoliday('2026-01-05')).toBe(false);
  });
});

describe('Pricing', () => {
  it('flat-day is constant regardless of duration', () => {
    const right = getRightConfig(getCityRules('paris')!, 'RESIDENT')!;
    expect(computeAmountCents(right, 60)).toBe(150);
    expect(computeAmountCents(right, 600)).toBe(150);
  });

  it('hourly bills per started hour and respects the daily cap', () => {
    const right = getRightConfig(getCityRules('paris')!, 'OTHER')!;
    // 400 cents/hour, 90 min → 2 hours → 800.
    expect(computeAmountCents(right, 90)).toBe(800);
    // 6 hours → 2400 (under the 5000 cap).
    expect(computeAmountCents(right, 360)).toBe(2400);
  });
});
