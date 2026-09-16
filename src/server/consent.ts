import 'server-only';
import type { ConsentKind } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logAudit } from './audit';

export const CONSENT_VERSION = '2026-01';

export async function recordConsent(params: {
  userId: string;
  kind: ConsentKind;
  granted: boolean;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await prisma.consentLog.create({
    data: {
      userId: params.userId,
      kind: params.kind,
      granted: params.granted,
      version: CONSENT_VERSION,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  // The automation consent timestamp gates real (non-simulated) spending.
  if (params.kind === 'AUTOMATION') {
    await prisma.userPreferences.updateMany({
      where: { userId: params.userId },
      data: { consentAutomationAt: params.granted ? new Date() : null },
    });
  }

  await logAudit({
    userId: params.userId,
    actor: params.userId,
    category: 'CONSENT',
    action: `CONSENT_${params.granted ? 'GRANTED' : 'WITHDRAWN'}`,
    summary: `Consentement ${params.kind} ${params.granted ? 'accordé' : 'retiré'} (v${CONSENT_VERSION}).`,
    entityType: 'ConsentLog',
    ip: params.ip ?? null,
    userAgent: params.userAgent ?? null,
  });
}
