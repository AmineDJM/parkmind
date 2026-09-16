'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth';
import { recordConsent } from '@/server/consent';
import { logAudit } from '@/server/audit';

export interface SettingsState {
  error?: string;
  ok?: boolean;
  message?: string;
}

export async function updatePreferencesAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const parsed = z
    .object({
      dailyCapEur: z.coerce.number().min(0).max(500),
      monthlyCapEur: z.coerce.number().min(0).max(5000),
      confirmationThresholdEur: z.coerce.number().min(0).max(500),
      simulationMode: z.coerce.boolean().optional(),
      notifyByEmail: z.coerce.boolean().optional(),
      notifyInApp: z.coerce.boolean().optional(),
    })
    .safeParse({
      dailyCapEur: formData.get('dailyCapEur'),
      monthlyCapEur: formData.get('monthlyCapEur'),
      confirmationThresholdEur: formData.get('confirmationThresholdEur'),
      simulationMode: formData.get('simulationMode') === 'on',
      notifyByEmail: formData.get('notifyByEmail') === 'on',
      notifyInApp: formData.get('notifyInApp') === 'on',
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }
  const d = parsed.data;
  // Free plan is simulation-only.
  const simulationMode = user.planTier === 'FREE' ? true : d.simulationMode ?? false;

  await prisma.userPreferences.update({
    where: { userId: user.id },
    data: {
      dailyCapCents: Math.round(d.dailyCapEur * 100),
      monthlyCapCents: Math.round(d.monthlyCapEur * 100),
      confirmationThresholdCents: Math.round(d.confirmationThresholdEur * 100),
      simulationMode,
      notifyByEmail: d.notifyByEmail ?? false,
      notifyInApp: d.notifyInApp ?? false,
    },
  });
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { ok: true, message: 'Préférences enregistrées.' };
}

export async function updateProfileAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const name = z.string().trim().min(1).max(80).safeParse(formData.get('name'));
  if (!name.success) return { error: 'Nom invalide.' };
  await prisma.user.update({ where: { id: user.id }, data: { name: name.data } });
  revalidatePath('/settings');
  return { ok: true, message: 'Profil mis à jour.' };
}

export async function withdrawConsentAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const h = await headers();
  await recordConsent({
    userId: user.id,
    kind: 'AUTOMATION',
    granted: false,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: h.get('user-agent') ?? null,
  });
  // Withdrawing consent also pauses automations to be safe.
  await prisma.userPreferences.update({
    where: { userId: user.id },
    data: { automationEnabled: false },
  });
  revalidatePath('/settings');
  revalidatePath('/dashboard');
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const confirm = String(formData.get('confirm') ?? '');
  if (confirm !== user.email) {
    // Wrong confirmation — do nothing (the page instructs the user).
    return;
  }
  await logAudit({
    userId: null,
    actor: user.id,
    category: 'ADMIN',
    action: 'ACCOUNT_DELETED',
    summary: `Compte supprimé (${user.email}).`,
  });
  await prisma.user.delete({ where: { id: user.id } });
  await clearSessionCookie();
  redirect('/?deleted=1');
}
