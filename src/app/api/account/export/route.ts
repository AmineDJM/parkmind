import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/server/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GDPR data export: the user's own data as a downloadable JSON file. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [
    preferences,
    vehicles,
    rights,
    automations,
    sessions,
    payments,
    notifications,
    consents,
    connections,
  ] = await Promise.all([
    prisma.userPreferences.findUnique({ where: { userId: user.id } }),
    prisma.vehicle.findMany({ where: { userId: user.id } }),
    prisma.parkingRight.findMany({ where: { userId: user.id } }),
    prisma.automationRule.findMany({ where: { userId: user.id } }),
    prisma.parkingSession.findMany({ where: { userId: user.id } }),
    prisma.payment.findMany({ where: { userId: user.id } }),
    prisma.notification.findMany({ where: { userId: user.id } }),
    prisma.consentLog.findMany({ where: { userId: user.id } }),
    prisma.providerConnection.findMany({
      where: { userId: user.id },
      // Never export internal opaque refs.
      select: { id: true, providerId: true, label: true, status: true, paymentMethodLabel: true, createdAt: true },
    }),
  ]);

  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'CONSENT',
    action: 'DATA_EXPORTED',
    summary: 'Export RGPD des données.',
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      planTier: user.planTier,
      createdAt: user.createdAt,
    },
    preferences,
    vehicles,
    rights,
    automations,
    sessions,
    payments,
    notifications,
    consents,
    connections,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="parkmind-export-${user.id}.json"`,
    },
  });
}
