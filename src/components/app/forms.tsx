'use client';

import { useActionState, useMemo, useState } from 'react';
import {
  createVehicleAction,
  type VehicleFormState,
} from '@/server/actions/vehicles';
import { createRightAction, type RightFormState } from '@/server/actions/rights';
import { createRuleAction, type RuleFormState } from '@/server/actions/automation';
import { PROVIDER_LABELS, RIGHT_TYPE_LABELS } from '@/domain/enums';
import type { ProviderKey, RightType } from '@/domain/enums';
import type { CityOption } from '@/components/onboarding/onboarding-wizard';
import { Input, Select, Field, Switch, Alert, SubmitButton, Label } from '@/components/ui';
import { cn } from '@/lib/utils';

const DAYS = [
  { v: 1, l: 'Lun' },
  { v: 2, l: 'Mar' },
  { v: 3, l: 'Mer' },
  { v: 4, l: 'Jeu' },
  { v: 5, l: 'Ven' },
  { v: 6, l: 'Sam' },
  { v: 7, l: 'Dim' },
];

export interface VehicleLite {
  id: string;
  label: string;
}

export function NewVehicleForm({ cities }: { cities: { slug: string; name: string }[] }) {
  const [state, action] = useActionState<VehicleFormState, FormData>(createVehicleAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Plaque d'immatriculation" htmlFor="plate">
        <Input id="plate" name="plate" placeholder="AA-123-AA" autoCapitalize="characters" required />
      </Field>
      <Field label="Modèle (optionnel)" htmlFor="model">
        <Input id="model" name="model" placeholder="Peugeot 208" />
      </Field>
      <Field label="Ville" htmlFor="citySlug">
        <Select id="citySlug" name="citySlug" defaultValue={cities[0]?.slug}>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </Field>
      <SubmitButton pendingLabel="Ajout…">Ajouter le véhicule</SubmitButton>
    </form>
  );
}

export function NewRightForm({
  cities,
  vehicles,
}: {
  cities: CityOption[];
  vehicles: VehicleLite[];
}) {
  const [state, action] = useActionState<RightFormState, FormData>(createRightAction, {});
  const [citySlug, setCitySlug] = useState(cities[0]?.slug ?? 'paris');
  const city = useMemo(() => cities.find((c) => c.slug === citySlug) ?? cities[0]!, [cities, citySlug]);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Type de droit" htmlFor="type">
        <Select id="type" name="type" defaultValue="RESIDENT">
          {(['RESIDENT', 'PROFESSIONAL', 'OTHER'] as RightType[]).map((t) => (
            <option key={t} value={t}>{RIGHT_TYPE_LABELS[t]}</option>
          ))}
        </Select>
      </Field>
      <Field label="Ville" htmlFor="citySlug">
        <Select id="citySlug" name="citySlug" value={citySlug} onChange={(e) => setCitySlug(e.target.value)}>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Zone (optionnel)" htmlFor="zoneCode">
        <Select id="zoneCode" name="zoneCode" defaultValue="">
          <option value="">Toute la ville</option>
          {city.zones.map((z) => (
            <option key={z.code} value={z.code}>{z.name}</option>
          ))}
        </Select>
      </Field>
      {vehicles.length > 0 && (
        <Field label="Véhicule (optionnel)" htmlFor="vehicleId">
          <Select id="vehicleId" name="vehicleId" defaultValue="">
            <option value="">Aucun / tous</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </Select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Référence (optionnel)" htmlFor="reference">
          <Input id="reference" name="reference" placeholder="RES-000000" />
        </Field>
        <Field label="Expire le (optionnel)" htmlFor="expiresOn">
          <Input id="expiresOn" name="expiresOn" type="date" />
        </Field>
      </div>
      <SubmitButton pendingLabel="Ajout…">Ajouter le droit</SubmitButton>
    </form>
  );
}

export function NewAutomationForm({
  cities,
  vehicles,
}: {
  cities: CityOption[];
  vehicles: VehicleLite[];
}) {
  const [state, action] = useActionState<RuleFormState, FormData>(createRuleAction, {});
  const [citySlug, setCitySlug] = useState(cities[0]?.slug ?? 'paris');
  const city = useMemo(() => cities.find((c) => c.slug === citySlug) ?? cities[0]!, [cities, citySlug]);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);

  if (vehicles.length === 0) {
    return (
      <Alert tone="warning">
        Ajoutez d'abord un véhicule avant de créer une automatisation.
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Véhicule" htmlFor="vehicleId">
        <Select id="vehicleId" name="vehicleId" defaultValue={vehicles[0]?.id}>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ville" htmlFor="citySlug">
          <Select id="citySlug" name="citySlug" value={citySlug} onChange={(e) => setCitySlug(e.target.value)}>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Zone" htmlFor="zoneCode">
          <Select id="zoneCode" name="zoneCode" defaultValue={city.zones[0]?.code}>
            {city.zones.map((z) => (
              <option key={z.code} value={z.code}>{z.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Opérateur" htmlFor="operator">
        <Select id="operator" name="operator" defaultValue={city.operators[0]}>
          {city.operators.map((op) => (
            <option key={op} value={op}>
              {PROVIDER_LABELS[op]}{op === 'MOCK' ? ' (simulation)' : ''}
            </option>
          ))}
        </Select>
      </Field>
      <div>
        <Label className="mb-2 block">Jours</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = days.includes(d.v);
            return (
              <label
                key={d.v}
                className={cn(
                  'cursor-pointer select-none rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  on ? 'border-brand bg-brand-soft text-brand' : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <input
                  type="checkbox"
                  name="daysOfWeek"
                  value={d.v}
                  checked={on}
                  onChange={() =>
                    setDays((p) => (p.includes(d.v) ? p.filter((x) => x !== d.v) : [...p, d.v]))
                  }
                  className="sr-only"
                />
                {d.l}
              </label>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="À partir de" htmlFor="startTime">
          <Input id="startTime" name="startTime" type="time" defaultValue="08:45" required />
        </Field>
        <Field label="Jusqu'à" htmlFor="endTime">
          <Input id="endTime" name="endTime" type="time" defaultValue="20:00" required />
        </Field>
      </div>
      <label className="flex items-center justify-between rounded-lg border border-border p-4">
        <span className="text-sm font-medium">Mode simulation</span>
        <Switch name="simulationMode" defaultChecked />
      </label>
      <SubmitButton pendingLabel="Création…">Créer l'automatisation</SubmitButton>
    </form>
  );
}
