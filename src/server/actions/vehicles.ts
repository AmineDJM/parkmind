'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getCityRules } from '@/cities';
import { ensureCity } from '@/server/catalog';
import { vehicleLimitFor } from '@/server/billing';
import { normalizePlate, formatPlate } from '@/lib/utils';
import { logAudit } from '@/server/audit';

export interface VehicleFormState {
  error?: string;
}

const schema = z.object({
  plate: z.string().trim().min(2, 'Plaque requise.').max(15),
  model: z.string().trim().max(60).optional().or(z.literal('')),
  citySlug: z.string().min(1),
});

export async function createVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const parsed = schema.safeParse({
    plate: formData.get('plate'),
    model: formData.get('model') ?? '',
    citySlug: formData.get('citySlug'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }
  const city = getCityRules(parsed.data.citySlug);
  if (!city) return { error: 'Ville non prise en charge.' };

  const count = await prisma.vehicle.count({ where: { userId: user.id } });
  if (count >= vehicleLimitFor(user.planTier)) {
    return {
      error: `Votre offre est limitée à ${vehicleLimitFor(user.planTier)} véhicule(s). Passez à une offre supérieure.`,
    };
  }

  const plate = normalizePlate(parsed.data.plate);
  const dupe = await prisma.vehicle.findUnique({
    where: { userId_plate: { userId: user.id, plate } },
  });
  if (dupe) return { error: 'Ce véhicule existe déjà.' };

  const cityRow = await ensureCity(parsed.data.citySlug);
  const vehicle = await prisma.vehicle.create({
    data: {
      userId: user.id,
      plate,
      displayPlate: formatPlate(parsed.data.plate),
      model: parsed.data.model || null,
      cityId: cityRow.id,
    },
  });
  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'ADMIN',
    action: 'VEHICLE_CREATED',
    summary: `Véhicule ${vehicle.displayPlate} ajouté.`,
    entityType: 'Vehicle',
    entityId: vehicle.id,
  });
  revalidatePath('/vehicles');
  redirect('/vehicles');
}

export async function deleteVehicleAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('vehicleId') ?? '');
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) return;
  await prisma.vehicle.delete({ where: { id } });
  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'ADMIN',
    action: 'VEHICLE_DELETED',
    summary: `Véhicule ${vehicle.displayPlate} supprimé.`,
    entityType: 'Vehicle',
    entityId: id,
  });
  revalidatePath('/vehicles');
  revalidatePath('/dashboard');
}

export async function setVehicleStatusAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('vehicleId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['ACTIVE', 'INACTIVE'].includes(status)) return;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: user.id } });
  if (!vehicle) return;
  await prisma.vehicle.update({
    where: { id },
    data: { status: status as 'ACTIVE' | 'INACTIVE' },
  });
  revalidatePath('/vehicles');
}
