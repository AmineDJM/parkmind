/**
 * French public holidays (métropole). Fixed dates + Easter-derived movable
 * feasts (Easter Monday, Ascension, Pentecost Monday), computed with the
 * Meeus/Jones/Butcher algorithm. Pure and deterministic — safe for the engine.
 */

function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** UTC date helpers keep the arithmetic timezone-independent. */
function addDays(y: number, m: number, d: number, delta: number): string {
  const base = Date.UTC(y, m - 1, d);
  const dt = new Date(base + delta * 86_400_000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const cache = new Map<number, Set<string>>();

/** Returns the set of "yyyy-MM-dd" public holidays for a given year. */
export function frenchPublicHolidays(year: number): Set<string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const fixed = [
    `${year}-01-01`, // Jour de l'An
    `${year}-05-01`, // Fête du Travail
    `${year}-05-08`, // Victoire 1945
    `${year}-07-14`, // Fête Nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice 1918
    `${year}-12-25`, // Noël
  ];

  const easter = easterSunday(year);
  const movable = [
    addDays(year, easter.month, easter.day, 1), // Lundi de Pâques
    addDays(year, easter.month, easter.day, 39), // Ascension
    addDays(year, easter.month, easter.day, 50), // Lundi de Pentecôte
  ];

  const set = new Set<string>([...fixed, ...movable]);
  cache.set(year, set);
  return set;
}

export function isFrenchPublicHoliday(ymd: string): boolean {
  const year = Number(ymd.slice(0, 4));
  return frenchPublicHolidays(year).has(ymd);
}
