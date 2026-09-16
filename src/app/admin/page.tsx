import type { Metadata } from 'next';
import { AlertTriangle, Power } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSystemFlags } from '@/server/settings';
import { PROVIDER_LABELS } from '@/domain/enums';
import type { ProviderKey } from '@/domain/enums';
import { PROVIDER_HEALTH } from '@/lib/display';
import { formatMoney, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, Badge, Alert, SubmitButton } from '@/components/ui';
import { PageHeader, StatTile } from '@/components/app/bits';
import {
  setKillSwitchAction,
  setGlobalAutomationsAction,
  setProviderEnabledAction,
  setCityEnabledAction,
} from '@/server/actions/admin';

export const metadata: Metadata = { title: 'Admin · Vue d\'ensemble' };

export default async function AdminOverviewPage() {
  const [
    users,
    vehicles,
    activeAutomations,
    sessions,
    autoSessions,
    started,
    failed,
    confirm,
    realSpend,
    simSpend,
    providers,
    cities,
    flags,
    recentFailures,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count(),
    prisma.automationRule.count({ where: { status: 'ACTIVE' } }),
    prisma.parkingSession.count(),
    prisma.parkingSession.count({ where: { origin: 'AUTOMATION' } }),
    prisma.parkingSession.count({ where: { status: { in: ['ACTIVE', 'SIMULATED', 'COMPLETED'] } } }),
    prisma.parkingSession.count({ where: { status: 'FAILED' } }),
    prisma.parkingSession.count({ where: { status: 'REQUIRES_CONFIRMATION' } }),
    prisma.payment.aggregate({ where: { simulated: false, status: 'SUCCEEDED' }, _sum: { amountCents: true } }),
    prisma.payment.aggregate({ where: { simulated: true, status: 'SIMULATED' }, _sum: { amountCents: true } }),
    prisma.parkingProvider.findMany({ orderBy: { name: 'asc' } }),
    prisma.city.findMany({ orderBy: { name: 'asc' } }),
    getSystemFlags(),
    prisma.parkingSession.findMany({
      where: { status: 'FAILED' },
      include: { user: true, zone: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  const failureRate =
    started + failed > 0 ? Math.round((failed / (started + failed)) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Administration" description="Santé du service, sécurité et métriques globales." />

      {flags.killSwitch && (
        <Alert tone="danger" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Kill switch actif : aucune session n'est démarrée, réelle ou simulée.
        </Alert>
      )}

      {/* System controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-4 w-4" /> Contrôles système
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Kill switch global</p>
              <p className="text-xs text-muted-foreground">Stoppe toute activation immédiatement.</p>
            </div>
            <form action={setKillSwitchAction}>
              <input type="hidden" name="value" value={(!flags.killSwitch).toString()} />
              <SubmitButton variant={flags.killSwitch ? 'success' : 'danger'} size="sm" pendingLabel="…">
                {flags.killSwitch ? 'Désactiver' : 'Activer'}
              </SubmitButton>
            </form>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Automatisations globales</p>
              <p className="text-xs text-muted-foreground">
                {flags.automationsGloballyEnabled ? 'Activées' : 'Désactivées'} pour tous les utilisateurs.
              </p>
            </div>
            <form action={setGlobalAutomationsAction}>
              <input type="hidden" name="value" value={(!flags.automationsGloballyEnabled).toString()} />
              <SubmitButton variant="outline" size="sm" pendingLabel="…">
                {flags.automationsGloballyEnabled ? 'Désactiver tout' : 'Réactiver'}
              </SubmitButton>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Utilisateurs" value={users} />
        <StatTile label="Véhicules" value={vehicles} />
        <StatTile label="Automatisations actives" value={activeAutomations} />
        <StatTile label="Sessions" value={sessions} />
        <StatTile label="Actions automatiques" value={autoSessions} />
        <StatTile label="Dépenses réelles" value={formatMoney(realSpend._sum.amountCents ?? 0)} />
        <StatTile label="Dépenses simulées" value={formatMoney(simSpend._sum.amountCents ?? 0)} />
        <StatTile label="Taux d'échec" value={`${failureRate} %`} sub={`${failed} échec(s) · ${confirm} à confirmer`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Providers */}
        <Card>
          <CardHeader>
            <CardTitle>Santé des opérateurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {providers.map((p) => {
              const h = PROVIDER_HEALTH[p.health] ?? { label: p.health, tone: 'neutral' as const };
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{PROVIDER_LABELS[p.key as ProviderKey]}</span>
                    <Badge variant={h.tone}>{h.label}</Badge>
                    {!p.isEnabled && <Badge variant="danger">Désactivé</Badge>}
                  </div>
                  <form action={setProviderEnabledAction}>
                    <input type="hidden" name="providerId" value={p.id} />
                    <input type="hidden" name="enabled" value={(!p.isEnabled).toString()} />
                    <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                      {p.isEnabled ? 'Désactiver' : 'Activer'}
                    </SubmitButton>
                  </form>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Cities */}
        <Card>
          <CardHeader>
            <CardTitle>Villes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cities.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  {!c.isEnabled && <Badge variant="danger">Désactivée</Badge>}
                </div>
                <form action={setCityEnabledAction}>
                  <input type="hidden" name="cityId" value={c.id} />
                  <input type="hidden" name="enabled" value={(!c.isEnabled).toString()} />
                  <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                    {c.isEnabled ? 'Désactiver' : 'Activer'}
                  </SubmitButton>
                </form>
              </div>
            ))}
            {cities.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune ville en base (lancez le seed).</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent errors */}
      <Card>
        <CardHeader>
          <CardTitle>Échecs récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentFailures.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun échec récent. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentFailures.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.zone.name} · {s.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(s.createdAt)} — {s.errorCode ?? 'ERREUR'}: {s.errorMessage}
                    </p>
                  </div>
                  <Badge variant="danger">Échec</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
