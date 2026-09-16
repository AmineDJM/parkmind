import 'server-only';
import { nanoid } from 'nanoid';
import type {
  NotificationType,
  ParkingSession,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/db';
import { decide, explainDecision, type ParkingDecision } from '@/engine';
import { getProvider } from '@/providers';
import { getLocalParts } from '@/lib/time';
import { formatMoney } from '@/lib/utils';
import { logAudit } from './audit';
import { notify } from './notifications';
import {
  buildContextForRule,
  buildContextFromRule,
  type BuiltContext,
  type RuleForRun,
} from './context-builder';

export type RunOutcome =
  | 'STARTED'
  | 'EXTENDED'
  | 'SKIPPED'
  | 'CONFIRM'
  | 'FAILED'
  | 'ERROR';

export interface RunResult {
  outcome: RunOutcome;
  decision: ParkingDecision;
  session?: ParkingSession | null;
}

export interface RunOptions {
  now?: Date;
  actor?: string;
  origin?: 'AUTOMATION' | 'MANUAL';
  /** User explicitly authorized this one — bypass amount/cap confirmations. */
  override?: boolean;
}

function mapConfirmationType(code: string): NotificationType {
  switch (code) {
    case 'RIGHT_EXPIRED':
      return 'RIGHT_EXPIRED';
    case 'ZONE_NOT_RECOGNIZED':
      return 'ZONE_NOT_RECOGNIZED';
    case 'OVER_DAILY_CAP':
    case 'OVER_MONTHLY_CAP':
      return 'CAP_REACHED';
    default:
      return 'CONFIRMATION_REQUIRED';
  }
}

/** Run one automation rule end-to-end: decide, then execute + persist. */
export async function runAutomationRule(
  ruleId: string,
  opts: RunOptions = {},
): Promise<RunResult> {
  const now = opts.now ?? new Date();
  const origin = opts.origin ?? 'AUTOMATION';

  let built: BuiltContext | null;
  try {
    built = await buildContextForRule(ruleId, now);
  } catch (err) {
    const decision: ParkingDecision = {
      type: 'ERROR',
      code: 'CONTEXT_ERROR',
      reasons: [err instanceof Error ? err.message : 'Erreur de contexte.'],
      error: {
        code: 'CONTEXT_ERROR',
        message: err instanceof Error ? err.message : 'Erreur de contexte.',
      },
    };
    await logAudit({
      userId: null,
      actor: opts.actor ?? 'system',
      category: 'ENGINE_DECISION',
      action: 'ENGINE_ERROR',
      summary: decision.reasons[0] ?? 'Erreur',
      decisionType: 'ERROR',
      entityType: 'AutomationRule',
      entityId: ruleId,
    });
    return { outcome: 'ERROR', decision };
  }

  if (!built) {
    const decision: ParkingDecision = {
      type: 'ERROR',
      code: 'RULE_NOT_FOUND',
      reasons: ['Automatisation introuvable.'],
      error: { code: 'RULE_NOT_FOUND', message: 'Automatisation introuvable.' },
    };
    return { outcome: 'ERROR', decision };
  }

  const { rule, context } = built;

  // A user-authorized override lifts only the financial confirmation guards.
  if (opts.override) {
    context.caps.confirmationThresholdCents = Number.POSITIVE_INFINITY;
    context.caps.dailyCapCents = context.caps.platformDailyCapCents;
    context.caps.monthlyCapCents = context.caps.platformMonthlyCapCents;
  }

  const decision = decide(context);
  const local = getLocalParts(now, context.city.timezone);

  await logAudit({
    userId: rule.userId,
    actor: opts.actor ?? 'system',
    category: 'ENGINE_DECISION',
    action: `DECISION_${decision.type}`,
    summary: decision.reasons[0] ?? decision.type,
    decisionType: decision.type,
    entityType: 'AutomationRule',
    entityId: rule.id,
    data: {
      code: decision.code,
      reasons: decision.reasons,
      simulation: context.flags.simulationMode,
      explain: explainDecision(decision),
    } satisfies Prisma.InputJsonValue,
  });

  await prisma.automationRule.update({
    where: { id: rule.id },
    data: { lastRunAt: now },
  });

  switch (decision.type) {
    case 'NO_ACTION':
      return { outcome: 'SKIPPED', decision };

    case 'REQUIRE_USER_CONFIRMATION':
      return handleConfirmation(rule, context, decision, local.ymd, origin);

    case 'START_SESSION':
    case 'EXTEND_SESSION':
      return executeSession(built, decision, { ...opts, now, origin, ymd: local.ymd });

    case 'STOP_SESSION':
    case 'ERROR':
    default:
      return { outcome: decision.type === 'ERROR' ? 'ERROR' : 'SKIPPED', decision };
  }
}

async function handleConfirmation(
  rule: RuleForRun,
  context: BuiltContext['context'],
  decision: ParkingDecision,
  ymd: string,
  origin: 'AUTOMATION' | 'MANUAL',
): Promise<RunResult> {
  const idempotencyKey = `confirm:${rule.id}:${ymd}:${decision.code}`;
  const existing = await prisma.parkingSession.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    // Already surfaced today — do not re-notify on every cron tick.
    return { outcome: 'CONFIRM', decision, session: existing };
  }

  const amountCents = decision.confirmation?.amountCents ?? decision.plan?.amountCents ?? 0;
  const session = await prisma.parkingSession.create({
    data: {
      userId: rule.userId,
      vehicleId: rule.vehicleId,
      cityId: rule.cityId,
      zoneId: rule.zoneId,
      providerId: rule.providerConnection?.providerId ?? null,
      providerConnectionId: rule.providerConnectionId,
      automationRuleId: rule.id,
      origin,
      status: 'REQUIRES_CONFIRMATION',
      simulated: context.flags.simulationMode,
      decisionType: decision.type,
      decisionReasons: decision.reasons as unknown as Prisma.InputJsonValue,
      amountCents,
      currency: context.city.currency,
      startedAt: context.now,
      idempotencyKey,
    },
  });

  await notify({
    userId: rule.userId,
    type: mapConfirmationType(decision.code),
    title: 'Intervention requise',
    body: decision.confirmation?.message ?? decision.reasons[0] ?? 'Confirmation requise.',
    sessionId: session.id,
  });

  return { outcome: 'CONFIRM', decision, session };
}

async function executeSession(
  built: BuiltContext,
  decision: ParkingDecision,
  opts: RunOptions & { now: Date; origin: 'AUTOMATION' | 'MANUAL'; ymd: string },
): Promise<RunResult> {
  const { rule, context, operator, providerImplemented } = built;
  const plan = decision.plan!;
  const isExtend = decision.type === 'EXTEND_SESSION';
  const simulated = context.flags.simulationMode;

  // Idempotency: one automated session per rule per local day (no double buy).
  const idempotencyKey = isExtend
    ? `ext:${decision.targetSessionId}:${opts.ymd}:${plan.expiresAt.toISOString()}`
    : opts.origin === 'AUTOMATION'
      ? `auto:${rule.id}:${opts.ymd}`
      : `manual:${rule.id}:${opts.ymd}:${Math.floor(opts.now.getTime() / 60000)}`;

  const already = await prisma.parkingSession.findUnique({
    where: { idempotencyKey },
  });
  if (already && already.status !== 'REQUIRES_CONFIRMATION') {
    return { outcome: 'SKIPPED', decision, session: already };
  }

  // In simulation we always transact through the Mock; real mode uses the
  // resolved operator (only MOCK is implemented today).
  const provider = simulated || !providerImplemented ? getProvider('MOCK') : getProvider(operator);
  const providerId = rule.providerConnection?.providerId ?? (await mockProviderId());

  if (isExtend && decision.targetSessionId) {
    const target = await prisma.parkingSession.findUnique({
      where: { id: decision.targetSessionId },
      include: { payment: true },
    });
    if (!target) {
      return { outcome: 'ERROR', decision };
    }
    // Best-effort provider extend. The Mock keeps sessions in memory, so across
    // separate requests it may not know the external id; we still extend our DB
    // record (source of truth for the user).
    if (target.externalSessionId) {
      await provider
        .extendSession(target.externalSessionId, {
          idempotencyKey,
          additionalMinutes: plan.durationMinutes,
          newExpiresAt: plan.expiresAt,
          amountCents: plan.amountCents,
          simulated,
        })
        .catch(() => undefined);
    }
    const updated = await prisma.parkingSession.update({
      where: { id: target.id },
      data: {
        expiresAt: plan.expiresAt,
        amountCents: target.amountCents + plan.amountCents,
      },
    });
    // Payment is 1-1 with the session: fold the extension cost into it.
    if (target.payment) {
      await prisma.payment.update({
        where: { id: target.payment.id },
        data: { amountCents: target.payment.amountCents + plan.amountCents },
      });
    }
    await notify({
      userId: rule.userId,
      type: 'SESSION_EXTENDED',
      title: 'Stationnement prolongé',
      body: `${plan.zoneName} — prolongé jusqu'à ${fmtTime(plan.expiresAt, context.city.timezone)} (${formatMoney(plan.amountCents)}).`,
      sessionId: updated.id,
    });
    await logAudit({
      userId: rule.userId,
      actor: opts.actor ?? 'system',
      category: 'SESSION',
      action: 'SESSION_EXTENDED',
      summary: `Prolongation ${plan.zoneName} (${formatMoney(plan.amountCents)})`,
      decisionType: decision.type,
      entityType: 'ParkingSession',
      entityId: updated.id,
    });
    return { outcome: 'EXTENDED', decision, session: updated };
  }

  const startRes = await provider.startSession({
    idempotencyKey,
    plate: context.vehicle.plate,
    zoneCode: plan.zoneCode,
    tariffCode: plan.tariffCode,
    amountCents: plan.amountCents,
    currency: plan.currency,
    durationMinutes: plan.durationMinutes,
    startAt: plan.startAt,
    expiresAt: plan.expiresAt,
    connectionRef: rule.providerConnection?.externalAccountRef ?? null,
    simulated,
  });

  if (!startRes.ok) {
    const failed = await prisma.parkingSession.create({
      data: {
        userId: rule.userId,
        vehicleId: rule.vehicleId,
        cityId: rule.cityId,
        zoneId: rule.zoneId,
        providerId,
        providerConnectionId: rule.providerConnectionId,
        automationRuleId: opts.origin === 'AUTOMATION' ? rule.id : null,
        origin: opts.origin,
        status: 'FAILED',
        simulated,
        decisionType: decision.type,
        decisionReasons: decision.reasons as unknown as Prisma.InputJsonValue,
        tariffCode: plan.tariffCode,
        amountCents: plan.amountCents,
        currency: plan.currency,
        startedAt: plan.startAt,
        expiresAt: plan.expiresAt,
        idempotencyKey,
        errorCode: startRes.error.code,
        errorMessage: startRes.error.message,
      },
    });
    await prisma.payment.create({
      data: {
        userId: rule.userId,
        sessionId: failed.id,
        providerId,
        status: 'FAILED',
        amountCents: plan.amountCents,
        currency: plan.currency,
        simulated,
        failureReason: startRes.error.message,
        idempotencyKey: `pay:${idempotencyKey}`,
      },
    });
    await notify({
      userId: rule.userId,
      type: 'PAYMENT_FAILED',
      title: 'Échec du paiement',
      body: `Le stationnement à ${plan.zoneName} n'a pas pu être activé : ${startRes.error.message}`,
      sessionId: failed.id,
    });
    await logAudit({
      userId: rule.userId,
      actor: opts.actor ?? 'system',
      category: 'PAYMENT',
      action: 'SESSION_FAILED',
      summary: `Échec ${plan.zoneName} — ${startRes.error.code}`,
      decisionType: decision.type,
      entityType: 'ParkingSession',
      entityId: failed.id,
    });
    return { outcome: 'FAILED', decision, session: failed };
  }

  const session = await prisma.parkingSession.create({
    data: {
      userId: rule.userId,
      vehicleId: rule.vehicleId,
      cityId: rule.cityId,
      zoneId: rule.zoneId,
      providerId,
      providerConnectionId: rule.providerConnectionId,
      automationRuleId: opts.origin === 'AUTOMATION' ? rule.id : null,
      origin: opts.origin,
      status: simulated ? 'SIMULATED' : 'ACTIVE',
      simulated,
      decisionType: decision.type,
      decisionReasons: decision.reasons as unknown as Prisma.InputJsonValue,
      tariffCode: plan.tariffCode,
      amountCents: plan.amountCents,
      currency: plan.currency,
      startedAt: plan.startAt,
      expiresAt: plan.expiresAt,
      externalSessionId: startRes.data.externalSessionId,
      idempotencyKey,
      payment: {
        create: {
          userId: rule.userId,
          providerId,
          status: simulated ? 'SIMULATED' : 'SUCCEEDED',
          amountCents: plan.amountCents,
          currency: plan.currency,
          simulated,
          externalPaymentRef: startRes.data.externalSessionId,
          idempotencyKey: `pay:${idempotencyKey}`,
        },
      },
    },
  });

  const simTag = simulated ? ' (simulation)' : '';
  await notify({
    userId: rule.userId,
    type: 'SESSION_STARTED',
    title: simulated ? 'Stationnement simulé' : 'Stationnement activé',
    body: `${plan.zoneName} — ${fmtTime(plan.startAt, context.city.timezone)} → ${fmtTime(plan.expiresAt, context.city.timezone)} · ${formatMoney(plan.amountCents)}${simTag}`,
    sessionId: session.id,
  });
  await logAudit({
    userId: rule.userId,
    actor: opts.actor ?? 'system',
    category: 'SESSION',
    action: 'SESSION_STARTED',
    summary: `${plan.zoneName} activé (${formatMoney(plan.amountCents)})${simTag}`,
    decisionType: decision.type,
    entityType: 'ParkingSession',
    entityId: session.id,
  });

  return { outcome: 'STARTED', decision, session };
}

let cachedMockId: string | null = null;
async function mockProviderId(): Promise<string | null> {
  if (cachedMockId) return cachedMockId;
  const row = await prisma.parkingProvider.findUnique({ where: { key: 'MOCK' } });
  cachedMockId = row?.id ?? null;
  return cachedMockId;
}

function fmtTime(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  }).format(d);
}

/**
 * Run every eligible automation rule. Called by the secured cron endpoint and
 * the worker script.
 */
export async function runDueAutomations(
  now: Date = new Date(),
): Promise<{ processed: number; started: number; confirm: number; failed: number; skipped: number }> {
  const rules = await prisma.automationRule.findMany({
    where: {
      status: 'ACTIVE',
      user: { isSuspended: false, onboardedAt: { not: null } },
      city: { isEnabled: true },
    },
    select: { id: true },
  });

  const counts = { processed: 0, started: 0, confirm: 0, failed: 0, skipped: 0 };
  for (const r of rules) {
    const res = await runAutomationRule(r.id, { now, origin: 'AUTOMATION' });
    counts.processed++;
    if (res.outcome === 'STARTED' || res.outcome === 'EXTENDED') counts.started++;
    else if (res.outcome === 'CONFIRM') counts.confirm++;
    else if (res.outcome === 'FAILED' || res.outcome === 'ERROR') counts.failed++;
    else counts.skipped++;
  }
  return counts;
}

/** Decide what Parkmind WOULD do right now, without persisting anything. */
export async function previewRule(
  ruleId: string,
  now: Date = new Date(),
): Promise<{ decision: ParkingDecision; simulation: boolean } | null> {
  const built = await buildContextForRule(ruleId, now);
  if (!built) return null;
  return {
    decision: decide(built.context),
    simulation: built.context.flags.simulationMode,
  };
}

export { buildContextFromRule };
