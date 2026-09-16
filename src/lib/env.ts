/**
 * Centralized, typed access to environment configuration.
 * Reads are lazy and defaulted so the app degrades gracefully in dev.
 */

function str(key: string, fallback = ''): string {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v;
}

function bool(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  return v === 'true' || v === '1' || v === 'yes';
}

function int(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  databaseUrl: str('DATABASE_URL'),
  appUrl: str('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  nodeEnv: str('NODE_ENV', 'development'),
  isProduction: str('NODE_ENV') === 'production',

  authSecret: str('AUTH_SECRET', 'dev-insecure-secret-change-me'),
  sessionDays: int('AUTH_SESSION_DAYS', 30),

  cronSecret: str('CRON_SECRET', 'dev-cron-secret'),

  // Hard platform ceilings (euros → cents) applied above user preferences.
  platformDailyCapCents: Math.round(int('PLATFORM_DAILY_CAP_EUR', 20) * 100),
  platformMonthlyCapCents: Math.round(int('PLATFORM_MONTHLY_CAP_EUR', 200) * 100),

  // Global kill switch bootstrap (a DB SystemSetting can override at runtime).
  killSwitch: bool('PARKMIND_KILL_SWITCH', false),
  defaultSimulationMode: bool('DEFAULT_SIMULATION_MODE', true),

  mailDriver: str('MAIL_DRIVER', 'console'),
  mailFrom: str('MAIL_FROM', 'Parkmind <no-reply@parkmind.app>'),

  stripeSecretKey: str('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: str('STRIPE_WEBHOOK_SECRET'),
  billingEnabled: str('STRIPE_SECRET_KEY') !== '',

  sentryDsn: str('SENTRY_DSN'),

  adminEmails: str('ADMIN_EMAILS')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

export function isAdminEmail(email: string): boolean {
  return env.adminEmails.includes(email.trim().toLowerCase());
}
