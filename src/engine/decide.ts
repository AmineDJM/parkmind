import {
  findZoneInCity,
  getRightConfig,
  isFrenchPublicHoliday,
} from '@/cities';
import { RIGHT_TYPE_LABELS } from '@/domain/enums';
import type { RightType } from '@/domain/enums';
import {
  addMinutes,
  getLocalParts,
  hhmmToMinutes,
} from '@/lib/time';
import { computeAmountCents } from './pricing';
import type {
  ConfirmationKind,
  DecisionPlan,
  ParkingContext,
  ParkingDecision,
} from './types';

const EXTEND_WINDOW_MIN = 15;

const DAY_NAMES_FR = [
  '',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
];

function euros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

function noAction(code: string, ...reasons: string[]): ParkingDecision {
  return { type: 'NO_ACTION', code, reasons };
}

function requireConfirmation(
  kind: ConfirmationKind,
  message: string,
  reasons: string[],
  amountCents?: number,
): ParkingDecision {
  return {
    type: 'REQUIRE_USER_CONFIRMATION',
    code: kind,
    reasons,
    confirmation: { kind, message, amountCents },
  };
}

function engineError(code: string, message: string): ParkingDecision {
  return {
    type: 'ERROR',
    code,
    reasons: [message],
    error: { code, message },
  };
}

/**
 * The core decision function.
 *
 *   user + vehicle + parking_right + location + calendar + city_rules + operator
 *     -> parking_action
 *
 * Every branch produces an explainable decision. Safety guards run first, then
 * calendar/schedule, then right validity, then financial protections.
 */
export function decide(ctx: ParkingContext): ParkingDecision {
  try {
    return run(ctx);
  } catch (err) {
    return engineError(
      'ENGINE_EXCEPTION',
      err instanceof Error ? err.message : 'Erreur inattendue du moteur.',
    );
  }
}

function run(ctx: ParkingContext): ParkingDecision {
  const { city, flags, vehicle, right, rule, caps, activeSessions } = ctx;

  // ── 1. Global & administrative safety guards ──────────────────────────────
  if (flags.killSwitch) {
    return noAction(
      'KILL_SWITCH',
      "Arrêt d'urgence global (kill switch) activé : aucune action.",
    );
  }
  if (!flags.automationsGloballyEnabled) {
    return noAction(
      'AUTOMATIONS_DISABLED_GLOBAL',
      'Toutes les automatisations sont désactivées par un administrateur.',
    );
  }
  if (!flags.cityEnabled) {
    return noAction('CITY_DISABLED', `La ville ${city.name} est désactivée.`);
  }
  if (!flags.providerEnabled) {
    return noAction(
      'PROVIDER_DISABLED',
      `L'opérateur ${ctx.operator} est indisponible.`,
    );
  }
  if (!flags.userAutomationEnabled) {
    return noAction(
      'USER_PAUSED',
      'Parkmind est en pause pour cet utilisateur.',
    );
  }
  if (!flags.ruleActive) {
    return noAction('RULE_PAUSED', "Cette automatisation n'est pas active.");
  }

  // ── 2. Consent (only blocks real spending) ────────────────────────────────
  if (!flags.consentGiven && !flags.simulationMode) {
    return requireConfirmation(
      'NO_CONSENT',
      "Votre consentement explicite aux automatisations est requis avant tout paiement réel.",
      ['Aucun consentement enregistré pour les paiements automatiques.'],
    );
  }

  // ── 3. Zone recognition ───────────────────────────────────────────────────
  const zone = findZoneInCity(city, ctx.zoneCode);
  if (!zone) {
    return requireConfirmation(
      'ZONE_NOT_RECOGNIZED',
      `La zone « ${ctx.zoneCode} » n'est pas reconnue à ${city.name}. Vérifiez votre configuration.`,
      [`Zone inconnue : ${ctx.zoneCode}.`],
    );
  }
  if (!zone.isPaid) {
    return noAction(
      'ZONE_FREE',
      `${zone.name} est une zone gratuite : aucun ticket nécessaire.`,
    );
  }

  // ── 4. Calendar (municipal rules first) ───────────────────────────────────
  const local = getLocalParts(ctx.now, city.timezone);
  const dayName = DAY_NAMES_FR[local.isoDayOfWeek] ?? '';
  const rightType: RightType = right?.type ?? 'OTHER';

  if (city.calendar.observesFrenchPublicHolidays && isFrenchPublicHoliday(local.ymd)) {
    return noAction(
      'HOLIDAY',
      `${local.ymd} est un jour férié : stationnement gratuit.`,
    );
  }
  const freeDates = city.calendar.freeDates ?? [];
  if (freeDates.includes(local.ymd) || freeDates.includes(local.monthDay)) {
    return noAction('FREE_DATE', `Stationnement gratuit le ${local.ymd}.`);
  }
  if (
    (city.calendar.freeMonthsForResidents ?? []).includes(local.month) &&
    rightType === 'RESIDENT'
  ) {
    return noAction(
      'RESIDENT_FREE_MONTH',
      `Gratuité résident ce mois-ci à ${city.name} : aucun ticket nécessaire.`,
    );
  }
  if (!city.calendar.paidDaysOfWeek.includes(local.isoDayOfWeek)) {
    return noAction(
      'NOT_PAID_DAY',
      `Le ${dayName} n'est pas un jour payant à ${city.name} : stationnement gratuit.`,
    );
  }

  // ── 5. Rule schedule ──────────────────────────────────────────────────────
  if (!rule.daysOfWeek.includes(local.isoDayOfWeek)) {
    return noAction(
      'OUTSIDE_SCHEDULE_DAYS',
      `Le ${dayName} n'est pas programmé dans cette automatisation.`,
    );
  }

  const nowMin = local.hours * 60 + local.minutes;
  const windowStartMin = Math.max(
    hhmmToMinutes(rule.startTime),
    hhmmToMinutes(city.calendar.paidHours.start),
  );
  const windowEndMin = Math.min(
    hhmmToMinutes(rule.endTime),
    hhmmToMinutes(city.calendar.paidHours.end),
  );
  if (windowEndMin <= windowStartMin) {
    return noAction(
      'OUTSIDE_PAID_HOURS',
      "La plage horaire de l'automatisation ne recoupe pas les horaires payants.",
    );
  }
  if (nowMin < windowStartMin) {
    return noAction(
      'BEFORE_WINDOW',
      `Trop tôt : le stationnement payant / la plage débute à ${minutesToHHmm(windowStartMin)}.`,
    );
  }
  if (nowMin >= windowEndMin) {
    return noAction(
      'AFTER_WINDOW',
      `La plage payante est terminée pour aujourd'hui (fin à ${minutesToHHmm(windowEndMin)}).`,
    );
  }

  // ── 6. Vehicle presence ───────────────────────────────────────────────────
  if (!vehicle.present) {
    return noAction(
      'VEHICLE_ABSENT',
      `Le véhicule ${vehicle.displayPlate} n'est pas signalé présent dans ${zone.name}.`,
    );
  }

  // ── 7. Tariff / right resolution ──────────────────────────────────────────
  const cityRight = getRightConfig(city, rightType);
  if (!cityRight) {
    return engineError(
      'TARIFF_NOT_CONFIGURED',
      `Aucun tarif configuré pour le droit ${rightType} à ${city.name}.`,
    );
  }

  if (cityRight.requiresValidRight) {
    if (!right) {
      return requireConfirmation(
        'RIGHT_MISSING',
        `Un droit ${RIGHT_TYPE_LABELS[rightType]} valide est requis mais aucun n'est enregistré.`,
        [`Droit ${rightType} requis et manquant.`],
      );
    }
    const expiredByDate = right.expiresOn != null && right.expiresOn < ctx.now;
    if (right.status === 'EXPIRED' || expiredByDate) {
      return requireConfirmation(
        'RIGHT_EXPIRED',
        `Votre droit ${RIGHT_TYPE_LABELS[rightType]} a expiré. Renouvelez-le pour réactiver l'automatisation.`,
        ['Droit de stationnement expiré.'],
      );
    }
    if (right.status === 'REVOKED') {
      return requireConfirmation(
        'RIGHT_MISSING',
        `Votre droit ${RIGHT_TYPE_LABELS[rightType]} a été révoqué.`,
        ['Droit de stationnement révoqué.'],
      );
    }
    if (right.status === 'PENDING_VERIFICATION') {
      return requireConfirmation(
        'RIGHT_PENDING',
        `Votre droit ${RIGHT_TYPE_LABELS[rightType]} est en cours de vérification.`,
        ['Droit de stationnement en attente de vérification.'],
      );
    }
    if (right.startsOn != null && right.startsOn > ctx.now) {
      return requireConfirmation(
        'RIGHT_NOT_YET_VALID',
        `Votre droit ${RIGHT_TYPE_LABELS[rightType]} n'est pas encore valide.`,
        ['Droit de stationnement pas encore valide.'],
      );
    }
  }

  // ── 8. Existing session (idempotency / no double buy) ─────────────────────
  const now = ctx.now;
  const activeHere = activeSessions.filter(
    (s) =>
      s.zoneCode === zone.code && (s.expiresAt == null || s.expiresAt > now),
  );
  if (activeHere.length > 0) {
    // Flat-day tariffs cover the whole day: never re-buy or extend.
    if (cityRight.pricing.kind === 'FLAT_DAY') {
      return noAction(
        'SESSION_ACTIVE',
        `Une session est déjà active dans ${zone.name} : la journée est couverte.`,
      );
    }
    // Hourly: extend only if expiring soon and paid window remains.
    const soonest = activeHere
      .map((s) => s.expiresAt)
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const expiringSoon =
      soonest != null &&
      (soonest.getTime() - now.getTime()) / 60000 <= EXTEND_WINDOW_MIN;
    if (!expiringSoon) {
      return noAction(
        'SESSION_ACTIVE',
        `Une session est déjà active dans ${zone.name} et n'expire pas avant ${EXTEND_WINDOW_MIN} min.`,
      );
    }
    const target = activeHere.find((s) => s.expiresAt === soonest)!;
    const remainingMinutes = windowEndMin - nowMin;
    const durationMinutes = Math.min(
      remainingMinutes,
      cityRight.maxDurationMinutes,
      rule.maxDurationMinutes ?? Number.POSITIVE_INFINITY,
      city.maxDurationMinutes,
    );
    const amountCents = computeAmountCents(cityRight, durationMinutes);
    const capDecision = checkCaps(ctx, amountCents);
    if (capDecision) return capDecision;
    const plan = buildPlan(ctx, zone.code, zone.name, cityRight.tariffCode, rightType, amountCents, durationMinutes, now);
    return {
      type: 'EXTEND_SESSION',
      code: 'EXTEND_SESSION',
      targetSessionId: target.id,
      reasons: [
        `Session existante dans ${zone.name} expirant bientôt.`,
        `Plage payante encore ouverte jusqu'à ${minutesToHHmm(windowEndMin)}.`,
        `Prolongation de ${durationMinutes} min — ${euros(amountCents)}.`,
      ],
      plan,
    };
  }

  // ── 9. Compute duration & amount for a fresh session ──────────────────────
  const remainingMinutes = windowEndMin - nowMin;
  const durationMinutes = Math.min(
    remainingMinutes,
    cityRight.maxDurationMinutes,
    rule.maxDurationMinutes ?? Number.POSITIVE_INFINITY,
    city.maxDurationMinutes,
  );
  const amountCents = computeAmountCents(cityRight, durationMinutes);

  // ── 10. Financial protections ─────────────────────────────────────────────
  const capDecision = checkCaps(ctx, amountCents);
  if (capDecision) return capDecision;

  // ── 11. Start the session ─────────────────────────────────────────────────
  const plan = buildPlan(ctx, zone.code, zone.name, cityRight.tariffCode, rightType, amountCents, durationMinutes, now);
  const rightReason = cityRight.requiresValidRight
    ? `droit ${RIGHT_TYPE_LABELS[rightType]} valide`
    : `stationnement rotatif`;
  return {
    type: 'START_SESSION',
    code: 'START_SESSION',
    reasons: [
      `véhicule ${vehicle.displayPlate} présent dans ${zone.name}`,
      rightReason,
      `stationnement payant actif aujourd'hui (${dayName})`,
      'aucune session active',
      `tarif applicable : ${cityRight.tariffCode} — ${euros(amountCents)} pour ${durationMinutes} min`,
      ctx.flags.simulationMode ? 'mode simulation : aucun paiement réel' : 'paiement réel autorisé',
    ],
    plan,
  };
}

function checkCaps(ctx: ParkingContext, amountCents: number): ParkingDecision | null {
  const { caps } = ctx;
  const effDailyCap = Math.min(caps.dailyCapCents, caps.platformDailyCapCents);
  const effMonthlyCap = Math.min(caps.monthlyCapCents, caps.platformMonthlyCapCents);

  if (caps.spentTodayCents + amountCents > effDailyCap) {
    return requireConfirmation(
      'OVER_DAILY_CAP',
      `Ce paiement (${euros(amountCents)}) dépasserait votre plafond journalier (${euros(effDailyCap)}).`,
      [
        `Dépense du jour : ${euros(caps.spentTodayCents)} + ${euros(amountCents)} > plafond ${euros(effDailyCap)}.`,
      ],
      amountCents,
    );
  }
  if (caps.spentThisMonthCents + amountCents > effMonthlyCap) {
    return requireConfirmation(
      'OVER_MONTHLY_CAP',
      `Ce paiement dépasserait votre plafond mensuel (${euros(effMonthlyCap)}).`,
      [
        `Dépense du mois : ${euros(caps.spentThisMonthCents)} + ${euros(amountCents)} > plafond ${euros(effMonthlyCap)}.`,
      ],
      amountCents,
    );
  }
  if (amountCents > caps.confirmationThresholdCents) {
    return requireConfirmation(
      'AMOUNT_THRESHOLD',
      `Le montant (${euros(amountCents)}) dépasse votre seuil de confirmation (${euros(caps.confirmationThresholdCents)}).`,
      [
        `Montant ${euros(amountCents)} > seuil de confirmation ${euros(caps.confirmationThresholdCents)}.`,
      ],
      amountCents,
    );
  }
  return null;
}

function buildPlan(
  ctx: ParkingContext,
  zoneCode: string,
  zoneName: string,
  tariffCode: string,
  rightType: RightType,
  amountCents: number,
  durationMinutes: number,
  startAt: Date,
): DecisionPlan {
  return {
    zoneCode,
    zoneName,
    operator: ctx.operator,
    rightType,
    tariffCode,
    amountCents,
    currency: ctx.city.currency,
    durationMinutes,
    startAt,
    expiresAt: addMinutes(startAt, durationMinutes),
    simulated: ctx.flags.simulationMode,
  };
}

function minutesToHHmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
