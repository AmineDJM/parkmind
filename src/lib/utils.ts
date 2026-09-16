import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format integer cents as a localized currency string. */
export function formatMoney(
  cents: number,
  currency = 'EUR',
  locale = 'fr-FR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/** Format a date in a human, French-friendly way. */
export function formatDate(
  date: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
  locale = 'fr-FR',
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Normalize a French plate to uppercase without separators for matching. */
export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Pretty-print a normalized plate as AB-123-CD when it matches the SIV format. */
export function formatPlate(plate: string): string {
  const p = normalizePlate(plate);
  const siv = /^([A-Z]{2})(\d{3})([A-Z]{2})$/.exec(p);
  if (siv) return `${siv[1]}-${siv[2]}-${siv[3]}`;
  return plate.toUpperCase();
}

const DAY_LABELS_FR = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function formatDaysOfWeek(days: number[]): string {
  if (!days.length) return '—';
  const sorted = [...days].sort((a, b) => a - b);
  // Common shorthand.
  if (sorted.join(',') === '1,2,3,4,5') return 'Lun–Ven';
  if (sorted.join(',') === '1,2,3,4,5,6') return 'Lun–Sam';
  if (sorted.join(',') === '1,2,3,4,5,6,7') return 'Tous les jours';
  return sorted.map((d) => DAY_LABELS_FR[d] ?? d).join(', ');
}

export function initials(name: string | null | undefined, email?: string): string {
  const base = (name || email || '?').trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function clampCents(value: number): number {
  return Math.max(0, Math.round(value));
}
