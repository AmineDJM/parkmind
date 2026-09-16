'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getCityRules, findZoneInCity } from '@/cities';
import { ensureCity, ensureZone } from '@/server/catalog';
import { logAudit } from '@/server/audit';

export interface RightFormState {
  error?: string;
}

const schema = z.object({
  type: z.enum(['RESIDENT', 'PROFESSIONAL', 'OTHER']),
  citySlug: z.string().min(1),
  zoneCode: z.string().optional().or(z.literal('')),
  vehicleId: z.string().optional().or(z.literal('')),
  reference: z.string().trim().max(60).optional().or(z.literal('')),
  startsOn: z.string().optional().or(z.literal('')),
  expiresOn: z.string().optional().or(z.literal('')),
});

export async function createRightAction(
  _prev: RightFormState,
  formData: FormData,
): Promise<RightFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const parsed = schema.safeParse({
    type: formData.get('type'),
    citySlug: formData.get('citySlug'),
    zoneCode: formData.get('zoneCode') ?? '',
    vehicleId: formData.get('vehicleId') ?? '',
    reference: formData.get('reference') ?? '',
    startsOn: formData.get('startsOn') ?? '',
    expiresOn: formData.get('expiresOn') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }
  const d = parsed.data;
  const city = getCityRules(d.citySlug);
  if (!city) return { error: 'Ville non prise en charge.' };

  const cityRow = await ensureCity(d.citySlug);
  let zoneId: string | null = null;
  if (d.zoneCode && findZoneInCity(city, d.zoneCode)) {
    const { zone } = await ensureZone(d.citySlug, d.zoneCode);
    zoneId = zone.id;
  }

  if (d.vehicleId) {
    const v = await prisma.vehicle.findFirst({ where: { id: d.vehicleId, userId: user.id } });
    if (!v) return { error: 'Véhicule introuvable.' };
  }

  const expiresOn = d.expiresOn ? new Date(d.expiresOn) : null;
  const right = await prisma.parkingRight.create({
    data: {
      userId: user.id,
      vehicleId: d.vehicleId || null,
      cityId: cityRow.id,
      zoneId,
      type: d.type,
      status: expiresOn && expiresOn < new Date() ? 'EXPIRED' : 'ACTIVE',
      reference: d.reference || null,
      startsOn: d.startsOn ? new Date(d.startsOn) : null,
      expiresOn,
    },
  });
  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'ADMIN',
    action: 'RIGHT_CREATED',
    summary: `Droit ${d.type} ajouté (${city.name}).`,
    entityType: 'ParkingRight',
    entityId: right.id,
  });
  revalidatePath('/rights');
  redirect('/rights');
}

export async function deleteRightAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('rightId') ?? '');
  const right = await prisma.parkingRight.findFirst({ where: { id, userId: user.id } });
  if (!right) return;
  await prisma.parkingRight.delete({ where: { id } });
  revalidatePath('/rights');
}
