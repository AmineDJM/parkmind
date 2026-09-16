'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCityRules, getRightConfig, findZoneInCity } from '@/cities';
import type { ProviderKey, RightType } from '@/domain/enums';
import { getCurrentUser, ensurePreferences } from '@/lib/auth';
import { normalizePlate, formatPlate } from '@/lib/utils';
import { ensureZone, ensureProviderByKey } from '@/server/catalog';
import { recordConsent } from '@/server/consent';
import { logAudit } from '@/server/audit';

export interface OnboardingState {
  error?: string;
}

const schema = z.object({
  citySlug: z.string().min(1),
  rightType: z.enum(['RESIDENT', 'PROFESSIONAL', 'OTHER']),
  vehicleModel: z.string().trim().max(60).optional().or(z.literal('')),
  plate: z.string().trim().min(2, 'Plaque requise.').max(15),
  zoneCode: z.string().min(1, 'Zone requise.'),
  daysOfWeek: z.array(z.coerce.number().int().min(1).max(7)).min(1, 'Choisissez au moins un jour.'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Heure invalide.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Heure invalide.'),
  operator: z.enum(['PAYBYPHONE', 'EASYPARK', 'INDIGO_NEO', 'FLOWBIRD', 'MOCK']),
  paymentLabel: z.string().trim().max(40).optional().or(z.literal('')),
  rightReference: z.string().trim().max(60).optional().or(z.literal('')),
  rightExpiresOn: z.string().optional().or(z.literal('')),
  simulationMode: z.coerce.boolean().optional(),
  dailyCapEur: z.coerce.number().min(0).max(200).default(10),
  monthlyCapEur: z.coerce.number().min(0).max(2000).default(100),
  confirmationThresholdEur: z.coerce.number().min(0).max(200).default(5),
});

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const parsed = schema.safeParse({
    citySlug: formData.get('citySlug'),
    rightType: formData.get('rightType'),
    vehicleModel: formData.get('vehicleModel') ?? '',
    plate: formData.get('plate'),
    zoneCode: formData.get('zoneCode'),
    daysOfWeek: formData.getAll('daysOfWeek'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    operator: formData.get('operator'),
    paymentLabel: formData.get('paymentLabel') ?? '',
    rightReference: formData.get('rightReference') ?? '',
    rightExpiresOn: formData.get('rightExpiresOn') ?? '',
    simulationMode: formData.get('simulationMode') === 'on',
    dailyCapEur: formData.get('dailyCapEur') ?? 10,
    monthlyCapEur: formData.get('monthlyCapEur') ?? 100,
    confirmationThresholdEur: formData.get('confirmationThresholdEur') ?? 5,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }
  const d = parsed.data;

  if (!formData.get('consentAutomation')) {
    return { error: 'Vous devez consentir aux automatisations pour activer Parkmind.' };
  }

  const city = getCityRules(d.citySlug);
  if (!city) return { error: 'Ville non prise en charge.' };
  if (!findZoneInCity(city, d.zoneCode)) return { error: 'Zone non reconnue pour cette ville.' };
  if (!city.operators.includes(d.operator as ProviderKey)) {
    return { error: 'Opérateur non disponible pour cette ville.' };
  }

  const plate = normalizePlate(d.plate);
  const dupe = await prisma.vehicle.findUnique({
    where: { userId_plate: { userId: user.id, plate } },
  });
  if (dupe) return { error: 'Ce véhicule est déjà enregistré.' };

  // Resolve catalog rows (self-healing).
  const { city: cityRow, zone: zoneRow } = await ensureZone(d.citySlug, d.zoneCode);
  const providerRow = await ensureProviderByKey(d.operator as ProviderKey);
  await ensurePreferences(user.id);

  const rightCfg = getRightConfig(city, d.rightType as RightType);
  const needsRight = rightCfg?.requiresValidRight ?? false;
  const expiresOn = d.rightExpiresOn ? new Date(d.rightExpiresOn) : null;

  // Free plan is simulation-only.
  const effectiveSimulation = user.planTier === 'FREE' ? true : d.simulationMode ?? true;

  const rule = await prisma.$transaction(async (tx) => {
    const connection = await tx.providerConnection.create({
      data: {
        userId: user.id,
        providerId: providerRow.id,
        label: d.paymentLabel || `${providerRow.name}`,
        status: d.operator === 'MOCK' ? 'CONNECTED' : 'PENDING',
        paymentMethodLabel: d.paymentLabel || null,
      },
    });

    const vehicle = await tx.vehicle.create({
      data: {
        userId: user.id,
        plate,
        displayPlate: formatPlate(d.plate),
        model: d.vehicleModel || null,
        cityId: cityRow.id,
        defaultZoneId: zoneRow.id,
        providerConnectionId: connection.id,
      },
    });

    if (needsRight) {
      await tx.parkingRight.create({
        data: {
          userId: user.id,
          vehicleId: vehicle.id,
          cityId: cityRow.id,
          zoneId: zoneRow.id,
          type: d.rightType as RightType,
          status: expiresOn && expiresOn < new Date() ? 'EXPIRED' : 'ACTIVE',
          reference: d.rightReference || null,
          expiresOn,
        },
      });
    }

    const createdRule = await tx.automationRule.create({
      data: {
        userId: user.id,
        vehicleId: vehicle.id,
        cityId: cityRow.id,
        zoneId: zoneRow.id,
        providerConnectionId: connection.id,
        name: `${city.name} · ${zoneRow.name}`,
        status: 'ACTIVE',
        simulationMode: effectiveSimulation,
        daysOfWeek: d.daysOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
      },
    });

    await tx.userPreferences.update({
      where: { userId: user.id },
      data: {
        simulationMode: effectiveSimulation,
        dailyCapCents: Math.round(d.dailyCapEur * 100),
        monthlyCapCents: Math.round(d.monthlyCapEur * 100),
        confirmationThresholdCents: Math.round(d.confirmationThresholdEur * 100),
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { onboardedAt: new Date() },
    });

    return createdRule;
  });

  const h = await headers();
  await recordConsent({
    userId: user.id,
    kind: 'AUTOMATION',
    granted: true,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: h.get('user-agent') ?? null,
  });
  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'ADMIN',
    action: 'ONBOARDING_COMPLETED',
    summary: `Onboarding terminé — ${city.name} · ${zoneRow.name}`,
    entityType: 'AutomationRule',
    entityId: rule.id,
  });

  redirect('/dashboard?onboarded=1');
}
