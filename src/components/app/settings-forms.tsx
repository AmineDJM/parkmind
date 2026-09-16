'use client';

import { useActionState } from 'react';
import {
  updateProfileAction,
  updatePreferencesAction,
  type SettingsState,
} from '@/server/actions/settings';
import { Input, Field, Switch, Alert, SubmitButton, Label } from '@/components/ui';

const initial: SettingsState = {};

export function ProfileForm({
  defaultName,
  email,
}: {
  defaultName: string;
  email: string;
}) {
  const [state, action] = useActionState(updateProfileAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <Field label="Nom" htmlFor="name">
        <Input id="name" name="name" defaultValue={defaultName} required />
      </Field>
      <Field label="E-mail" htmlFor="email">
        <Input id="email" value={email} disabled />
      </Field>
      <div>
        <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
      </div>
    </form>
  );
}

export function PreferencesForm({
  prefs,
  isFree,
}: {
  prefs: {
    dailyCapCents: number;
    monthlyCapCents: number;
    confirmationThresholdCents: number;
    simulationMode: boolean;
    notifyByEmail: boolean;
    notifyInApp: boolean;
  };
  isFree: boolean;
}) {
  const [state, action] = useActionState(updatePreferencesAction, initial);
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}

      <label className="flex items-center justify-between rounded-lg border border-border p-4">
        <span>
          <span className="block text-sm font-medium">Mode simulation</span>
          <span className="block text-xs text-muted-foreground">
            {isFree
              ? "Inclus dans l'offre Free : les paiements réels nécessitent une offre supérieure."
              : "Décisions sans dépense réelle."}
          </span>
        </span>
        <Switch name="simulationMode" defaultChecked={prefs.simulationMode} disabled={isFree} />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Plafond / jour (€)" htmlFor="dailyCapEur">
          <Input id="dailyCapEur" name="dailyCapEur" type="number" min={0} step="0.5" defaultValue={(prefs.dailyCapCents / 100).toString()} />
        </Field>
        <Field label="Plafond / mois (€)" htmlFor="monthlyCapEur">
          <Input id="monthlyCapEur" name="monthlyCapEur" type="number" min={0} step="1" defaultValue={(prefs.monthlyCapCents / 100).toString()} />
        </Field>
        <Field label="Confirmation au-delà de (€)" htmlFor="confirmationThresholdEur">
          <Input id="confirmationThresholdEur" name="confirmationThresholdEur" type="number" min={0} step="0.5" defaultValue={(prefs.confirmationThresholdCents / 100).toString()} />
        </Field>
      </div>

      <div className="space-y-2">
        <Label>Notifications</Label>
        <label className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm">Par e-mail</span>
          <Switch name="notifyByEmail" defaultChecked={prefs.notifyByEmail} />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm">Dans l'application</span>
          <Switch name="notifyInApp" defaultChecked={prefs.notifyInApp} />
        </label>
      </div>

      <div>
        <SubmitButton pendingLabel="Enregistrement…">Enregistrer les préférences</SubmitButton>
      </div>
    </form>
  );
}
