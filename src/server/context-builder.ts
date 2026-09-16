import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { getCityRules } from '@/cities';
import type { ProviderKey, RightStatus, RightType } from '@/domain/enums';
import type {
  EngineActiveSession,
  EngineRight,
  ParkingContext,
} from '@/engine';
import { normalizePlate } from '@/lib/utils';
import { getSystemFlags } from './settings';
import { getUserSpend } from './spend';

export const ruleRunInclude = {
  user: { include: { preferences: true } },
  vehicle: true,
  city: true,
  zone: true,
  providerConnection: { include: { provider: true } },
} satisfies Prisma.AutomationRuleInclude;

export type RuleForRun = Prisma.AutomationRuleGetPayload<{
  include: typeof ruleRunInclude;
}>;

export interface BuiltContext {
  rule: RuleForRun;
  context: ParkingContext;
  /** Effective operator key resolved from the connection (defaults to MOCK). */
  operator: ProviderKey;
  providerImplemented: boolean;
}

const MIN = Number.POSITIVE_INFINITY;

export async function buildContextForRule(
  ruleId: string,
  now: Date = new Date(),
): Promise<BuiltContext | null> {
  const rule = await prisma.automationRule.findUnique({
    where: { id: ruleId },
    include: ruleRunInclude,
  });
  if (!rule) return null;
  return buildContextFromRule(rule, now);
}

export async function buildContextFromRule(
  rule: RuleForRun,
  now: Date = new Date(),
): Promise<BuiltContext> {
  const cityRules = getCityRules(rule.city.slug);
  if (!cityRules) {
    throw new Error(`Aucune règle configurée pour la ville « ${rule.city.slug} ».`);
  }

  const operator: ProviderKey =
    (rule.providerConnection?.provider.key as ProviderKey | undefined) ?? 'MOCK';
  const providerImplemented =
    rule.providerConnection?.provider.isImplemented ?? operator === 'MOCK';
  const providerEnabled =
    rule.providerConnection?.provider.isEnabled ?? true;

  const prefs = rule.user.preferences;
  const [systemFlags, spend, rightRow, activeRows] = await Promise.all([
    getSystemFlags(),
    getUserSpend(rule.userId, now, rule.city.timezone),
    prisma.parkingRight.findFirst({
      where: {
        userId: rule.userId,
        cityId: rule.cityId,
        OR: [{ vehicleId: rule.vehicleId }, { vehicleId: null }],
      },
      orderBy: [{ expiresOn: 'desc' }],
    }),
    prisma.parkingSession.findMany({
      where: {
        userId: rule.userId,
        vehicleId: rule.vehicleId,
        status: { in: ['ACTIVE', 'SIMULATED'] },
        expiresAt: { gt: now },
      },
      include: { zone: true },
    }),
  ]);

  const right: EngineRight | null = rightRow
    ? {
        id: rightRow.id,
        type: rightRow.type as RightType,
        status: rightRow.status as RightStatus,
        startsOn: rightRow.startsOn,
        expiresOn: rightRow.expiresOn,
      }
    : null;

  const activeSessions: EngineActiveSession[] = activeRows.map((s) => ({
    id: s.id,
    zoneCode: s.zone.code,
    expiresAt: s.expiresAt,
    simulated: s.simulated,
  }));

  const simulationMode =
    (prefs?.simulationMode ?? env.defaultSimulationMode) ||
    rule.simulationMode ||
    !providerImplemented; // real operators without an integration always simulate

  const context: ParkingContext = {
    now,
    city: cityRules,
    zoneCode: rule.zone.code,
    operator,
    vehicle: {
      id: rule.vehicle.id,
      plate: normalizePlate(rule.vehicle.plate),
      displayPlate: rule.vehicle.displayPlate,
      present: rule.vehiclePresentByDefault,
    },
    right,
    rule: {
      daysOfWeek: rule.daysOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      maxDurationMinutes: rule.maxDurationMinutes,
    },
    activeSessions,
    caps: {
      dailyCapCents: Math.min(prefs?.dailyCapCents ?? 1000, rule.dailyCapCents ?? MIN),
      monthlyCapCents: Math.min(
        prefs?.monthlyCapCents ?? 10000,
        rule.monthlyCapCents ?? MIN,
      ),
      confirmationThresholdCents: prefs?.confirmationThresholdCents ?? 500,
      spentTodayCents: spend.spentTodayCents,
      spentThisMonthCents: spend.spentThisMonthCents,
      platformDailyCapCents: env.platformDailyCapCents,
      platformMonthlyCapCents: env.platformMonthlyCapCents,
    },
    flags: {
      killSwitch: systemFlags.killSwitch,
      automationsGloballyEnabled: systemFlags.automationsGloballyEnabled,
      cityEnabled: rule.city.isEnabled,
      providerEnabled,
      userAutomationEnabled: prefs?.automationEnabled ?? true,
      ruleActive: rule.status === 'ACTIVE',
      simulationMode,
      consentGiven: prefs?.consentAutomationAt != null,
    },
  };

  return { rule, context, operator, providerImplemented };
}
