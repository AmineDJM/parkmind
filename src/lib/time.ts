import { formatInTimeZone } from 'date-fns-tz';

/**
 * Timezone-aware helpers. We always reason about parking in a city's *local*
 * wall-clock time (e.g. Europe/Paris), independent of the server's timezone.
 * `formatInTimeZone` is used throughout to avoid double-shift bugs.
 */

export interface LocalParts {
  /** ISO day of week: 1 = Monday … 7 = Sunday. */
  isoDayOfWeek: number;
  /** "HH:mm" local time. */
  hhmm: string;
  /** "yyyy-MM-dd" local date. */
  ymd: string;
  /** "MM-dd" local month/day. */
  monthDay: string;
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

export function getLocalParts(date: Date, timezone: string): LocalParts {
  const hhmm = formatInTimeZone(date, timezone, 'HH:mm');
  const ymd = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const [y, m, d] = ymd.split('-').map(Number) as [number, number, number];
  const [hh, mm] = hhmm.split(':').map(Number) as [number, number];
  return {
    isoDayOfWeek: Number(formatInTimeZone(date, timezone, 'i')),
    hhmm,
    ymd,
    monthDay: formatInTimeZone(date, timezone, 'MM-dd'),
    year: y,
    month: m,
    day: d,
    hours: hh,
    minutes: mm,
  };
}

/** Convert "HH:mm" to minutes since local midnight. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Whether `hhmm` is within [start, end) on the same day. */
export function isTimeWithin(hhmm: string, start: string, end: string): boolean {
  const t = hhmmToMinutes(hhmm);
  return t >= hhmmToMinutes(start) && t < hhmmToMinutes(end);
}

/** Minutes remaining from `hhmm` until `end` (0 if already past). */
export function minutesUntil(hhmm: string, end: string): number {
  return Math.max(0, hhmmToMinutes(end) - hhmmToMinutes(hhmm));
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
