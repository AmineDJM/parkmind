import 'server-only';
import { fromZonedTime } from 'date-fns-tz';
import { formatInTimeZone } from 'date-fns-tz';
import { prisma } from '@/lib/db';

export interface Spend {
  spentTodayCents: number;
  spentThisMonthCents: number;
  simulatedTodayCents: number;
  simulatedThisMonthCents: number;
}

/** UTC instant for local midnight (start of day/month) in a timezone. */
function startOfLocalDay(now: Date, tz: string): Date {
  const ymd = formatInTimeZone(now, tz, 'yyyy-MM-dd');
  return fromZonedTime(`${ymd}T00:00:00`, tz);
}
function startOfLocalMonth(now: Date, tz: string): Date {
  const ym = formatInTimeZone(now, tz, 'yyyy-MM');
  return fromZonedTime(`${ym}-01T00:00:00`, tz);
}

async function sumPayments(
  userId: string,
  since: Date,
  simulated: boolean,
): Promise<number> {
  const res = await prisma.payment.aggregate({
    where: {
      userId,
      simulated,
      status: simulated ? 'SIMULATED' : 'SUCCEEDED',
      createdAt: { gte: since },
    },
    _sum: { amountCents: true },
  });
  return res._sum.amountCents ?? 0;
}

/**
 * Real (non-simulated) spend feeds the engine's financial caps. Simulated spend
 * is tracked separately for display ("Parkmind aurait dépensé…").
 */
export async function getUserSpend(
  userId: string,
  now: Date,
  tz = 'Europe/Paris',
): Promise<Spend> {
  const dayStart = startOfLocalDay(now, tz);
  const monthStart = startOfLocalMonth(now, tz);
  const [today, month, simToday, simMonth] = await Promise.all([
    sumPayments(userId, dayStart, false),
    sumPayments(userId, monthStart, false),
    sumPayments(userId, dayStart, true),
    sumPayments(userId, monthStart, true),
  ]);
  return {
    spentTodayCents: today,
    spentThisMonthCents: month,
    simulatedTodayCents: simToday,
    simulatedThisMonthCents: simMonth,
  };
}
