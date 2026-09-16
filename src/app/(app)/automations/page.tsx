import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap, Plus, Play, Pause, Trash2, PlayCircle, Clock } from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PROVIDER_LABELS } from '@/domain/enums';
import type { ProviderKey } from '@/domain/enums';
import { formatDaysOfWeek, formatDateTime } from '@/lib/utils';
import { Card, CardContent, Badge, buttonVariants, SubmitButton } from '@/components/ui';
import { PageHeader, EmptyState } from '@/components/app/bits';
import {
  runRuleNowAction,
  setRuleStatusAction,
  deleteRuleAction,
} from '@/server/actions/automation';

export const metadata: Metadata = { title: 'Automatisations' };

export default async function AutomationsPage() {
  const user = await requireOnboardedUser();
  const rules = await prisma.automationRule.findMany({
    where: { userId: user.id },
    include: {
      vehicle: true,
      city: true,
      zone: true,
      providerConnection: { include: { provider: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div>
      <PageHeader
        title="Automatisations"
        description="Les règles qui pilotent votre stationnement. Le moteur vérifie toujours les règles municipales avant d'agir."
        action={
          <Link href="/automations/new" className={buttonVariants({ variant: 'brand', size: 'sm' })}>
            <Plus className="h-4 w-4" /> Nouvelle règle
          </Link>
        }
      />

      {rules.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-6 w-6" />}
          title="Aucune automatisation"
          description="Créez une règle pour activer le pilote automatique."
          action={
            <Link href="/automations/new" className={buttonVariants({ variant: 'brand' })}>
              Créer une automatisation
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {rules.map((r) => {
            const active = r.status === 'ACTIVE';
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.name ?? `${r.city.name} · ${r.zone.name}`}</p>
                      <Badge variant={active ? 'success' : 'neutral'}>
                        {active ? 'Active' : r.status === 'PAUSED' ? 'En pause' : 'Désactivée'}
                      </Badge>
                      {r.simulationMode && <Badge variant="info">Simulation</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.vehicle.displayPlate} · {formatDaysOfWeek(r.daysOfWeek)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {r.startTime} → {r.endTime}
                      </span>
                      <span>
                        {r.providerConnection
                          ? PROVIDER_LABELS[r.providerConnection.provider.key as ProviderKey]
                          : 'Mock'}
                      </span>
                    </p>
                    {r.lastRunAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dernière évaluation : {formatDateTime(r.lastRunAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <form action={runRuleNowAction}>
                      <input type="hidden" name="ruleId" value={r.id} />
                      <SubmitButton variant="subtle" size="sm" pendingLabel="…">
                        <PlayCircle className="h-4 w-4" /> Évaluer
                      </SubmitButton>
                    </form>
                    <form action={setRuleStatusAction}>
                      <input type="hidden" name="ruleId" value={r.id} />
                      <input type="hidden" name="status" value={active ? 'PAUSED' : 'ACTIVE'} />
                      <SubmitButton variant="outline" size="sm" pendingLabel="…">
                        {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {active ? 'Pause' : 'Activer'}
                      </SubmitButton>
                    </form>
                    <form action={deleteRuleAction}>
                      <input type="hidden" name="ruleId" value={r.id} />
                      <SubmitButton variant="ghost" size="icon" className="text-danger hover:bg-danger/10" pendingLabel="">
                        <Trash2 className="h-4 w-4" />
                      </SubmitButton>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
