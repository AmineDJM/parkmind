import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Car,
  Clock,
  Zap,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Pause,
  Play,
} from 'lucide-react';
import { requireOnboardedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSystemFlags } from '@/server/settings';
import { getUserSpend } from '@/server/spend';
import { previewRule } from '@/server/executor';
import { getCityRules } from '@/cities';
import { describeNextRun } from '@/lib/schedule';
import { formatMoney } from '@/lib/utils';
import { FPS_VALUE_EUR, DECISION_LABEL, RIGHT_STATUS } from '@/lib/display';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Alert,
  StatusDot,
  SubmitButton,
  buttonVariants,
} from '@/components/ui';
import { StatTile, ReasonList, SessionStatusBadge, EmptyState } from '@/components/app/bits';
import {
  toggleParkmindAction,
  runRuleNowAction,
  confirmDecisionAction,
} from '@/server/actions/automation';

export const metadata: Metadata = { title: 'Tableau de bord' };

function fmtTime(d: Date | null, tz: string): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  }).format(d);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string; verified?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireOnboardedUser();
  const now = new Date();

  const [rule, flags] = await Promise.all([
    prisma.automationRule.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { vehicle: true, city: true, zone: true },
      orderBy: { createdAt: 'asc' },
    }),
    getSystemFlags(),
  ]);

  const paused =
    flags.killSwitch ||
    !flags.automationsGloballyEnabled ||
    !(user.preferences?.automationEnabled ?? true);
  const simulation = user.preferences?.simulationMode ?? true;

  if (!rule) {
    return (
      <div>
        <EmptyState
          icon={<Zap className="h-6 w-6" />}
          title="Aucune automatisation active"
          description="Créez votre première règle pour que Parkmind pilote votre stationnement."
          action={
            <Link href="/automations/new" className={buttonVariants({ variant: 'brand' })}>
              Créer une automatisation
            </Link>
          }
        />
      </div>
    );
  }

  const tz = rule.city.timezone;
  const cityRules = getCityRules(rule.city.slug);

  const [activeSession, spend, right, recent, pending, preview] = await Promise.all([
    prisma.parkingSession.findFirst({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'SIMULATED'] },
        expiresAt: { gt: now },
      },
      include: { zone: true, vehicle: true, provider: true },
      orderBy: { startedAt: 'desc' },
    }),
    getUserSpend(user.id, now, tz),
    prisma.parkingRight.findFirst({
      where: { userId: user.id, cityId: rule.cityId },
      orderBy: { expiresOn: 'desc' },
    }),
    prisma.parkingSession.findMany({
      where: { userId: user.id },
      include: { zone: true, city: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.parkingSession.findMany({
      where: { userId: user.id, status: 'REQUIRES_CONFIRMATION' },
      include: { zone: true, automationRule: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    previewRule(rule.id, now),
  ]);

  const fpsCount = await prisma.parkingSession.count({
    where: { userId: user.id, status: { in: ['ACTIVE', 'SIMULATED', 'COMPLETED'] } },
  });

  const nextRun = describeNextRun(
    rule.daysOfWeek,
    rule.startTime,
    cityRules?.calendar.paidHours.start ?? '09:00',
    tz,
    now,
  );

  const decision = preview?.decision;
  const canStartNow =
    decision?.type === 'START_SESSION' || decision?.type === 'EXTEND_SESSION';
  const rightInfo = right ? RIGHT_STATUS[right.status] : null;

  return (
    <div className="flex flex-col gap-6">
      {sp.onboarded && (
        <Alert tone="success">
          🎉 Parkmind est activé. Voici votre tableau de bord.
        </Alert>
      )}
      {sp.verified && <Alert tone="success">Adresse e-mail vérifiée.</Alert>}

      {/* Hero status card */}
      <Card className="overflow-hidden">
        <div className="bg-brand-radial">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <StatusDot tone={paused ? 'muted' : 'success'} pulse={!paused} />
                {paused ? 'En pause' : 'Actif'}
              </span>
              {simulation && <Badge variant="info">Mode simulation</Badge>}
            </div>

            <div className="mt-5 flex items-center gap-2 text-muted-foreground">
              <Car className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {rule.vehicle.model ?? 'Véhicule'}
              </span>
              <span className="font-mono text-sm">— {rule.vehicle.displayPlate}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {rule.city.name} · {rule.zone.name}
            </p>

            {/* State */}
            <div className="mt-6">
              {activeSession ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Aujourd'hui
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <p className="text-lg font-semibold">
                      Stationnement {activeSession.simulated ? 'simulé' : 'activé'}
                    </p>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {fmtTime(activeSession.startedAt, tz)} →{' '}
                    {fmtTime(activeSession.expiresAt, tz)}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight">
                    {formatMoney(activeSession.amountCents)}
                  </p>
                </>
              ) : canStartNow && decision?.plan ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Maintenant
                  </p>
                  <p className="mt-1 text-lg font-semibold">Prêt à activer</p>
                  <p className="mt-1 text-muted-foreground">
                    {decision.plan.zoneName} ·{' '}
                    {fmtTime(decision.plan.startAt, tz)} →{' '}
                    {fmtTime(decision.plan.expiresAt, tz)}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight">
                    {formatMoney(decision.plan.amountCents)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    État
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {decision ? DECISION_LABEL[decision.type] : 'Sous contrôle'}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {decision?.reasons[0] ?? 'Aucune action nécessaire pour le moment.'}
                  </p>
                </>
              )}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              {paused
                ? 'Parkmind est en pause. Réactivez quand vous le souhaitez.'
                : 'Tout est sous contrôle.'}
            </p>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <form action={toggleParkmindAction}>
                <SubmitButton variant={paused ? 'brand' : 'outline'}>
                  {paused ? (
                    <>
                      <Play className="h-4 w-4" /> Réactiver Parkmind
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" /> Mettre en pause
                    </>
                  )}
                </SubmitButton>
              </form>
              {!activeSession && !paused && canStartNow && (
                <form action={runRuleNowAction}>
                  <input type="hidden" name="ruleId" value={rule.id} />
                  <SubmitButton variant="subtle" pendingLabel="…">
                    <PlayCircle className="h-4 w-4" />
                    {simulation ? 'Simuler maintenant' : 'Activer maintenant'}
                  </SubmitButton>
                </form>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Coût aujourd'hui" value={formatMoney(spend.spentTodayCents)} sub={simulation ? `dont ${formatMoney(spend.simulatedTodayCents)} simulé` : undefined} />
        <StatTile label="Coût ce mois" value={formatMoney(spend.spentThisMonthCents)} sub={simulation ? `dont ${formatMoney(spend.simulatedThisMonthCents)} simulé` : undefined} />
        <StatTile label="FPS potentiellement évités" value={fpsCount} sub={`≈ ${formatMoney(fpsCount * FPS_VALUE_EUR * 100)}`} accent />
        <StatTile label="Prochaine activation" value={<span className="text-base">{nextRun}</span>} />
      </div>

      {/* Alerts / pending confirmations */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          {pending.map((p) => (
            <Alert key={p.id} tone="warning" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <strong>Intervention requise</strong> · {p.zone.name} —{' '}
                {(p.decisionReasons as string[])?.[0] ?? 'Confirmation nécessaire.'}
              </span>
              {p.automationRuleId && (
                <form action={confirmDecisionAction}>
                  <input type="hidden" name="ruleId" value={p.automationRuleId} />
                  <SubmitButton size="sm" pendingLabel="…">Autoriser cette fois</SubmitButton>
                </form>
              )}
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Live decision */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Décision en direct</CardTitle>
            {decision && <Badge variant="outline">{DECISION_LABEL[decision.type]}</Badge>}
          </CardHeader>
          <CardContent>
            {decision ? (
              <ReasonList reasons={decision.reasons} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Impossible d'évaluer la règle pour le moment.
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Le moteur Parkmind réévalue cette décision à chaque cycle. Chaque
              décision est explicable et journalisée.
            </p>
          </CardContent>
        </Card>

        {/* Current context */}
        <Card>
          <CardHeader>
            <CardTitle>Votre configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Véhicule">
              <span className="font-mono">{rule.vehicle.displayPlate}</span>
            </Row>
            <Row label="Droit actuel">
              {right ? (
                <span className="inline-flex items-center gap-2">
                  {rightInfo && <Badge variant={rightInfo.tone}>{rightInfo.label}</Badge>}
                  {right.expiresOn && (
                    <span className="text-muted-foreground">
                      exp. {new Intl.DateTimeFormat('fr-FR').format(right.expiresOn)}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">Aucun (visiteur)</span>
              )}
            </Row>
            <Row label="Zone">{rule.zone.name}</Row>
            <Row label="Horaires">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {rule.startTime} → {rule.endTime}
              </span>
            </Row>
            <div className="pt-2">
              <Link href="/automations" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Gérer les automatisations
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent history */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Historique récent</CardTitle>
          <Link href="/history" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
            Tout voir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune session pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {s.zone.name} · {s.city.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(s.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatMoney(s.amountCents)}</span>
                    <SessionStatusBadge status={s.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
