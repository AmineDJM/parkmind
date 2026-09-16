import 'server-only';
import type { AuditCategory, DecisionType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface AuditInput {
  userId?: string | null;
  actor?: string | null;
  category: AuditCategory;
  action: string;
  summary: string;
  decisionType?: DecisionType | null;
  entityType?: string | null;
  entityId?: string | null;
  data?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

/** Append an immutable audit-log entry. Never throws to the caller. */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        actor: input.actor ?? 'system',
        category: input.category,
        action: input.action,
        summary: input.summary,
        decisionType: input.decisionType ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        data: input.data ?? undefined,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    // Auditing must never break the primary flow.
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write log', err);
  }
}
