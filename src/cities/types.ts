import type { ProviderKey, RightType, ZoneKind } from '@/domain/enums';

/**
 * City rules configuration model.
 *
 * The whole point: parking rules are declared here, per city, and consumed by
 * the engine. They are NEVER hardcoded in the frontend. Adding a city = adding
 * one config object. Adding a country later = same shape.
 *
 * These values are configurable approximations for the MVP. Municipal and
 * operator rules remain the sole legal authority (see `disclaimer`).
 */

export type PricingModel =
  | { kind: 'FLAT_DAY'; amountCents: number }
  | { kind: 'HOURLY'; perHourCents: number; maxDailyCents?: number };

export interface CityRightConfig {
  type: RightType;
  label: string;
  pricing: PricingModel;
  /** Max session length this right allows, in minutes. */
  maxDurationMinutes: number;
  /** Whether a valid ParkingRight record is required to use this tariff. */
  requiresValidRight: boolean;
  tariffCode: string;
  notes?: string;
}

export interface ZoneConfig {
  /** Stable, globally-unique code, e.g. "paris-16". */
  code: string;
  /** Human label, e.g. "Paris 16e". */
  name: string;
  kind: ZoneKind;
  isPaid: boolean;
  /** Alternate identifiers a user might enter, e.g. ["16", "16e", "75116"]. */
  aliases?: string[];
}

export interface CityCalendar {
  /** ISO days of week that are paid (1 = Mon … 7 = Sun). */
  paidDaysOfWeek: number[];
  paidHours: { start: string; end: string };
  /** Additional explicit free dates ("yyyy-MM-dd" or "MM-dd"). */
  freeDates?: string[];
  /** Whole months (1-12) that are free for residents (e.g. Paris in August). */
  freeMonthsForResidents?: number[];
  observesFrenchPublicHolidays: boolean;
}

export interface CityRules {
  slug: string;
  name: string;
  country: string;
  /** IANA timezone, e.g. "Europe/Paris". */
  timezone: string;
  currency: string;
  status: 'LIVE' | 'BETA';
  /** Operators known to serve this city. */
  operators: ProviderKey[];
  calendar: CityCalendar;
  maxDurationMinutes: number;
  zones: ZoneConfig[];
  rights: CityRightConfig[];
  constraints?: string[];
  disclaimer?: string;
}
