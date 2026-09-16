import type { Metadata } from 'next';
import { History as HistoryIcon } from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PROVIDER_LABELS } from '@/domain/enums';
import type { ProviderKey } from '@/domain/enums';
import { formatMoney, formatDateTime } from '@/lib/utils';
import { DECISION_LABEL } from '@/lib/display';
import { Card, CardContent, Badge } from '@/components/ui';
import { PageHeader, EmptyState, SessionStatusBadge } from '@/components/app/bits';

export const metadata: Metadata = { title: 'Historique' };

function duration(start: Date, end: Date | null): string {
  if (!end) return '—';
  const min = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

export default async function HistoryPage() {
  const user = await requireOnboardedUser();
  const sessions = await prisma.parkingSession.findMany({
    where: { userId: user.id },
    include: { city: true, zone: true, vehicle: true, provider: true, payment: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Historique"
        description="Chaque tentative de Parkmind : décision, résultat, montant et transaction."
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-6 w-6" />}
          title="Aucune session"
          description="Les décisions et sessions de Parkmind apparaîtront ici."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => {
            const reasons = (s.decisionReasons as string[]) ?? [];
            return (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {s.zone.name} · {s.city.name}
                        </p>
                        <SessionStatusBadge status={s.status} />
                        {s.simulated && <Badge variant="info">Simulation</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(s.createdAt)} · {s.vehicle.displayPlate} ·{' '}
                        {s.provider ? PROVIDER_LABELS[s.provider.key as ProviderKey] : 'Mock'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatMoney(s.amountCents)}</p>
                      <p className="text-xs text-muted-foreground">
                        {duration(s.startedAt, s.expiresAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">{DECISION_LABEL[s.decisionType] ?? s.decisionType}</Badge>
                    {s.errorCode && <Badge variant="danger">{s.errorCode}</Badge>}
                    {s.externalSessionId && (
                      <span className="font-mono text-muted-foreground">#{s.externalSessionId}</span>
                    )}
                  </div>

                  {reasons.length > 0 && (
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Voir la décision
                      </summary>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        {reasons.map((r, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
