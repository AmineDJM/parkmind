import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import { DECISION_LABEL } from '@/lib/display';
import { Card, CardContent, Badge } from '@/components/ui';
import { PageHeader } from '@/components/app/bits';

export const metadata: Metadata = { title: 'Admin · Journaux' };

const CATEGORY_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'danger' | 'success' | 'brand'> = {
  ENGINE_DECISION: 'info',
  SESSION: 'success',
  PAYMENT: 'brand',
  AUTH: 'neutral',
  ADMIN: 'warning',
  PROVIDER: 'info',
  CONSENT: 'brand',
  SECURITY: 'danger',
  SYSTEM: 'neutral',
};

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 150,
  });

  return (
    <div>
      <PageHeader title="Journaux d'audit" description="Chaque décision et action est journalisée." />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-4 p-3.5 text-sm">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={CATEGORY_TONE[l.category] ?? 'neutral'}>{l.category}</Badge>
                    <span className="font-medium">{l.action}</span>
                    {l.decisionType && (
                      <span className="text-xs text-muted-foreground">
                        {DECISION_LABEL[l.decisionType] ?? l.decisionType}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground">{l.summary}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{formatDateTime(l.createdAt)}</p>
                  <p className="font-mono">{l.actor}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Aucun journal pour le moment.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
