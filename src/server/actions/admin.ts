'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { setSystemFlag, SETTING_KEYS } from '@/server/settings';
import { logAudit } from '@/server/audit';

async function requireAdminId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect('/dashboard');
  return user.id;
}

export async function setKillSwitchAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminId();
  const on = String(formData.get('value')) === 'true';
  await setSystemFlag(SETTING_KEYS.KILL_SWITCH, on, `admin:${adminId}`);
  revalidatePath('/admin');
}

export async function setGlobalAutomationsAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminId();
  const on = String(formData.get('value')) === 'true';
  await setSystemFlag(SETTING_KEYS.AUTOMATIONS_ENABLED, on, `admin:${adminId}`);
  revalidatePath('/admin');
}

export async function setProviderEnabledAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminId();
  const id = String(formData.get('providerId') ?? '');
  const enabled = String(formData.get('enabled')) === 'true';
  await prisma.parkingProvider.update({ where: { id }, data: { isEnabled: enabled } });
  await logAudit({
    actor: `admin:${adminId}`,
    category: 'PROVIDER',
    action: enabled ? 'PROVIDER_ENABLED' : 'PROVIDER_DISABLED',
    summary: `Opérateur ${id} ${enabled ? 'activé' : 'désactivé'}.`,
    entityType: 'ParkingProvider',
    entityId: id,
  });
  revalidatePath('/admin');
}

export async function setCityEnabledAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminId();
  const id = String(formData.get('cityId') ?? '');
  const enabled = String(formData.get('enabled')) === 'true';
  await prisma.city.update({ where: { id }, data: { isEnabled: enabled } });
  await logAudit({
    actor: `admin:${adminId}`,
    category: 'ADMIN',
    action: enabled ? 'CITY_ENABLED' : 'CITY_DISABLED',
    summary: `Ville ${id} ${enabled ? 'activée' : 'désactivée'}.`,
    entityType: 'City',
    entityId: id,
  });
  revalidatePath('/admin');
}

export async function setUserSuspendedAction(formData: FormData): Promise<void> {
  const adminId = await requireAdminId();
  const id = String(formData.get('userId') ?? '');
  const suspended = String(formData.get('suspended')) === 'true';
  if (id === adminId) return; // never suspend yourself
  await prisma.user.update({ where: { id }, data: { isSuspended: suspended } });
  await logAudit({
    userId: id,
    actor: `admin:${adminId}`,
    category: 'SECURITY',
    action: suspended ? 'USER_SUSPENDED' : 'USER_REINSTATED',
    summary: `Utilisateur ${id} ${suspended ? 'suspendu' : 'réactivé'}.`,
    entityType: 'User',
    entityId: id,
  });
  revalidatePath('/admin/users');
}
