import type { Metadata } from 'next';
import { Download, ShieldCheck } from 'lucide-react';
import { requireOnboardedUser, ensurePreferences } from '@/lib/auth';
import { env } from '@/lib/env';
import { PLANS, getPlan } from '@/server/billing';
import { formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Alert,
  Input,
  Field,
  SubmitButton,
  buttonVariants,
} from '@/components/ui';
import { PageHeader } from '@/components/app/bits';
import { ProfileForm, PreferencesForm } from '@/components/app/settings-forms';
import { withdrawConsentAction, deleteAccountAction } from '@/server/actions/settings';

export const metadata: Metadata = { title: 'Réglages' };

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const prefs = user.preferences ?? (await ensurePreferences(user.id));
  const plan = getPlan(user.planTier);
  const isFree = user.planTier === 'FREE';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Réglages" description="Profil, sécurité financière, consentement et données." />

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultName={user.name ?? ''} email={user.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automatisation & sécurité financière</CardTitle>
          <CardDescription>
            Vos plafonds priment sur les décisions du moteur. Une confirmation est
            requise au-delà du seuil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            isFree={isFree}
            prefs={{
              dailyCapCents: prefs.dailyCapCents,
              monthlyCapCents: prefs.monthlyCapCents,
              confirmationThresholdCents: prefs.confirmationThresholdCents,
              simulationMode: prefs.simulationMode,
              notifyByEmail: prefs.notifyByEmail,
              notifyInApp: prefs.notifyInApp,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consentement aux automatisations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {prefs.consentAutomationAt ? (
            <Alert tone="success" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Consentement accordé le {formatDate(prefs.consentAutomationAt)}.
            </Alert>
          ) : (
            <Alert tone="warning">
              Aucun consentement actif. Les paiements réels sont bloqués.
            </Alert>
          )}
          <form action={withdrawConsentAction}>
            <SubmitButton variant="outline" size="sm" pendingLabel="…">
              Retirer mon consentement
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
          <CardDescription>
            Offre actuelle : <span className="font-semibold text-foreground">{plan.name}</span>.
            {!env.billingEnabled && ' La facturation en ligne est en préparation.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <div
                key={p.tier}
                className={`rounded-lg border p-4 ${p.tier === user.planTier ? 'border-brand bg-brand-soft' : 'border-border'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{p.name}</p>
                  {p.tier === user.planTier && <Badge variant="brand">Actuel</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.priceEurMonth === null
                    ? 'Sur devis'
                    : p.priceEurMonth === 0
                      ? 'Gratuit'
                      : `${p.priceEurMonth.toFixed(2)} €/mois`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données & confidentialité</CardTitle>
          <CardDescription>Conformément au RGPD, vous contrôlez vos données.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <a href="/api/account/export" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-fit' })}>
            <Download className="h-4 w-4" /> Exporter mes données (JSON)
          </a>

          <details className="rounded-lg border border-danger/30 bg-danger/5 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-danger">
              Supprimer définitivement mon compte
            </summary>
            <div className="mt-3">
              <p className="mb-3 text-sm text-muted-foreground">
                Cette action est irréversible. Toutes vos données (véhicules, droits,
                sessions, historique) seront supprimées. Saisissez votre e-mail{' '}
                <span className="font-mono">{user.email}</span> pour confirmer.
              </p>
              <form action={deleteAccountAction} className="flex flex-col gap-3 sm:flex-row">
                <Field label="" className="flex-1">
                  <Input name="confirm" placeholder={user.email} autoComplete="off" />
                </Field>
                <SubmitButton variant="danger" pendingLabel="Suppression…">
                  Supprimer mon compte
                </SubmitButton>
              </form>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
