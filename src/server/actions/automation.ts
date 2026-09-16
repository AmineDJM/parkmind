'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getCityRules, findZoneInCity } from '@/cities';
import type { ProviderKey } from '@/domain/enums';
import { ensureZone, ensureProviderByKey } from '@/server/catalog';
import { runAutomationRule } from '@/server/executor';
import { logAudit } from '@/server/audit';

async function ownedRule(userId: string, ruleId: string) {
  return prisma.automationRule.findFirst({ where: { id: ruleId, userId } });
}

/** Global pause / resume for the user (Parkmind actif ↔ en pause). */
export async function toggleParkmindAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const prefs = await prisma.userPreferences.findUnique({ where: { userId: user.id } });
  const next = !(prefs?.automationEnabled ?? true);
  await prisma.userPreferences.update({
    where: { userId: user.id },
    data: { automationEnabled: next },
  });
  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'ADMIN',
    action: next ? 'PARKMIND_RESUMED' : 'PARKMIND_PAUSED',
    summary: next ? 'Parkmind réactivé.' : 'Parkmind mis en pause.',
  });
  revalidatePath('/dashboard');
  revalidatePath('/automations');
}

export async function runRuleNowAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const ruleId = String(formData.get('ruleId') ?? '');
  const rule = await ownedRule(user.id, ruleId);
  if (!rule) return;
  await runAutomationRule(ruleId, { origin: 'MANUAL', actor: user.id });
  revalidatePath('/dashboard');
  revalidatePath('/history');
  revalidatePath('/automations');
}

/** User authorizes a decision that required confirmation (bypasses caps only). */
export async function confirmDecisionAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const ruleId = String(formData.get('ruleId') ?? '');
  const rule = await ownedRule(user.id, ruleId);
  if (!rule) return;
  await runAutomationRule(ruleId, { origin: 'MANUAL', actor: user.id, override: true });
  revalidatePath('/dashboard');
  revalidatePath('/history');
  revalidatePath('/notifications');
}

export async function setRuleStatusAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const ruleId = String(formData.get('ruleId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['ACTIVE', 'PAUSED', 'DISABLED'].includes(status)) return;
  const rule = await ownedRule(user.id, ruleId);
  if (!rule) return;
  await prisma.automationRule.update({
    where: { id: ruleId },
    data: { status: status as 'ACTIVE' | 'PAUSED' | 'DISABLED' },
  });
  revalidatePath('/automations');
  revalidatePath('/dashboard');
}

export async function deleteRuleAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const ruleId = String(formData.get('ruleId') ?? '');
  const rule = await ownedRule(user.id, ruleId);
  if (!rule) return;
  await prisma.automationRule.delete({ where: { id: ruleId } });
  revalidatePath('/automations');
  revalidatePath('/dashboard');
}

const ruleSchema = z.object({
  vehicleId: z.string().min(1, 'Véhicule requis.'),
  citySlug: z.string().min(1),
  zoneCode: z.string().min(1, 'Zone requise.'),
  operator: z.enum(['PAYBYPHONE', 'EASYPARK', 'INDIGO_NEO', 'FLOWBIRD', 'MOCK']),
  daysOfWeek: z.array(z.coerce.number().int().min(1).max(7)).min(1, 'Choisissez au moins un jour.'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  simulationMode: z.coerce.boolean().optional(),
});

export interface RuleFormState {
  error?: string;
}

export async function createRuleAction(
  _prev: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const parsed = ruleSchema.safeParse({
    vehicleId: formData.get('vehicleId'),
    citySlug: formData.get('citySlug'),
    zoneCode: formData.get('zoneCode'),
    operator: formData.get('operator'),
    daysOfWeek: formData.getAll('daysOfWeek'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    simulationMode: formData.get('simulationMode') === 'on',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }
  const d = parsed.data;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: d.vehicleId, userId: user.id },
  });
  if (!vehicle) return { error: 'Véhicule introuvable.' };

  const city = getCityRules(d.citySlug);
  if (!city || !findZoneInCity(city, d.zoneCode)) return { error: 'Zone invalide.' };
  if (!city.operators.includes(d.operator as ProviderKey)) {
    return { error: 'Opérateur indisponible pour cette ville.' };
  }

  const { city: cityRow, zone } = await ensureZone(d.citySlug, d.zoneCode);
  const provider = await ensureProviderByKey(d.operator as ProviderKey);
  const connection = await prisma.providerConnection.create({
    data: {
      userId: user.id,
      providerId: provider.id,
      status: d.operator === 'MOCK' ? 'CONNECTED' : 'PENDING',
    },
  });

  await prisma.automationRule.create({
    data: {
      userId: user.id,
      vehicleId: vehicle.id,
      cityId: cityRow.id,
      zoneId: zone.id,
      providerConnectionId: connection.id,
      name: `${city.name} · ${zone.name}`,
      status: 'ACTIVE',
      simulationMode: user.planTier === 'FREE' ? true : d.simulationMode ?? true,
      daysOfWeek: d.daysOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
    },
  });

  revalidatePath('/automations');
  revalidatePath('/dashboard');
  redirect('/automations');
}
