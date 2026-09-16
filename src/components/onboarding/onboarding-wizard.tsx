'use client';

import { useMemo, useState } from 'react';
import { useActionState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  completeOnboardingAction,
  type OnboardingState,
} from '@/server/actions/onboarding';
import { PROVIDER_LABELS, RIGHT_TYPE_LABELS } from '@/domain/enums';
import type { ProviderKey, RightType } from '@/domain/enums';
import {
  Input,
  Select,
  Field,
  Switch,
  Badge,
  Alert,
  Button,
  SubmitButton,
  Label,
} from '@/components/ui';
import { cn, formatPlate } from '@/lib/utils';

export interface CityOption {
  slug: string;
  name: string;
  status: 'LIVE' | 'BETA';
  zones: { code: string; name: string }[];
  operators: ProviderKey[];
  rights: { type: RightType; label: string }[];
}

const DAYS = [
  { v: 1, l: 'Lun' },
  { v: 2, l: 'Mar' },
  { v: 3, l: 'Mer' },
  { v: 4, l: 'Jeu' },
  { v: 5, l: 'Ven' },
  { v: 6, l: 'Sam' },
  { v: 7, l: 'Dim' },
];

const STEPS = ['Ville & droit', 'Véhicule', 'Habitudes', 'Opérateur', 'Activation'];

export function OnboardingWizard({ cities }: { cities: CityOption[] }) {
  const [state, action] = useActionState<OnboardingState, FormData>(
    completeOnboardingAction,
    {},
  );
  const [step, setStep] = useState(0);

  const [citySlug, setCitySlug] = useState(cities[0]?.slug ?? 'paris');
  const city = useMemo(
    () => cities.find((c) => c.slug === citySlug) ?? cities[0]!,
    [cities, citySlug],
  );

  const [rightType, setRightType] = useState<RightType>('RESIDENT');
  const [zoneCode, setZoneCode] = useState(city?.zones[0]?.code ?? '');
  const [operator, setOperator] = useState<ProviderKey>(city?.operators[0] ?? 'MOCK');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [plate, setPlate] = useState('');
  const [simulation, setSimulation] = useState(true);

  function onCityChange(slug: string) {
    const c = cities.find((x) => x.slug === slug);
    setCitySlug(slug);
    if (c) {
      setZoneCode(c.zones[0]?.code ?? '');
      setOperator(c.operators[0] ?? 'MOCK');
    }
  }

  const needsRight = rightType !== 'OTHER';
  const canContinue =
    (step === 1 ? plate.trim().length >= 2 : true) &&
    (step === 2 ? days.length > 0 && zoneCode : true);

  const zoneName = city.zones.find((z) => z.code === zoneCode)?.name ?? zoneCode;

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Étape {step + 1} / {STEPS.length} · {STEPS[step]}
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)} %</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {state.error && <Alert tone="danger">{state.error}</Alert>}

      {/* Step 0 — City & right */}
      <fieldset className={cn('flex-col gap-4', step === 0 ? 'flex' : 'hidden')}>
        <Field label="Votre ville" htmlFor="citySlug">
          <Select
            id="citySlug"
            name="citySlug"
            value={citySlug}
            onChange={(e) => onCityChange(e.target.value)}
          >
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} {c.status === 'BETA' ? '(bêta)' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={city.status === 'LIVE' ? 'success' : 'warning'}>
            {city.status === 'LIVE' ? 'En direct' : 'Bêta'}
          </Badge>
          Les règles municipales sont configurées pour {city.name}.
        </div>
        <Field label="Votre statut / droit" htmlFor="rightType">
          <Select
            id="rightType"
            name="rightType"
            value={rightType}
            onChange={(e) => setRightType(e.target.value as RightType)}
          >
            {(['RESIDENT', 'PROFESSIONAL', 'OTHER'] as RightType[]).map((t) => (
              <option key={t} value={t}>
                {RIGHT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        {needsRight && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Référence du droit (optionnel)" htmlFor="rightReference" hint="N° de carte résident, etc.">
              <Input id="rightReference" name="rightReference" placeholder="RES-000000" />
            </Field>
            <Field label="Expire le (optionnel)" htmlFor="rightExpiresOn">
              <Input id="rightExpiresOn" name="rightExpiresOn" type="date" />
            </Field>
          </div>
        )}
      </fieldset>

      {/* Step 1 — Vehicle */}
      <fieldset className={cn('flex-col gap-4', step === 1 ? 'flex' : 'hidden')}>
        <Field label="Plaque d'immatriculation" htmlFor="plate">
          <Input
            id="plate"
            name="plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="AA-123-AA"
            autoCapitalize="characters"
            required
          />
        </Field>
        {plate.trim().length >= 2 && (
          <p className="text-xs text-muted-foreground">
            Enregistrée comme{' '}
            <span className="font-mono font-semibold text-foreground">
              {formatPlate(plate)}
            </span>
          </p>
        )}
        <Field label="Modèle (optionnel)" htmlFor="vehicleModel">
          <Input id="vehicleModel" name="vehicleModel" placeholder="Peugeot 208" />
        </Field>
      </fieldset>

      {/* Step 2 — Habits */}
      <fieldset className={cn('flex-col gap-4', step === 2 ? 'flex' : 'hidden')}>
        <Field label="Zone habituelle" htmlFor="zoneCode">
          <Select
            id="zoneCode"
            name="zoneCode"
            value={zoneCode}
            onChange={(e) => setZoneCode(e.target.value)}
          >
            {city.zones.map((z) => (
              <option key={z.code} value={z.code}>
                {z.name}
              </option>
            ))}
          </Select>
        </Field>
        <div>
          <Label className="mb-2 block">Jours de stationnement habituels</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = days.includes(d.v);
              return (
                <label
                  key={d.v}
                  className={cn(
                    'cursor-pointer select-none rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    on
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  <input
                    type="checkbox"
                    name="daysOfWeek"
                    value={d.v}
                    checked={on}
                    onChange={() =>
                      setDays((prev) =>
                        prev.includes(d.v)
                          ? prev.filter((x) => x !== d.v)
                          : [...prev, d.v],
                      )
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
      </fieldset>

      {/* Step 3 — Operator */}
      <fieldset className={cn('flex-col gap-4', step === 3 ? 'flex' : 'hidden')}>
        <Field label="Opérateur de stationnement" htmlFor="operator">
          <Select
            id="operator"
            name="operator"
            value={operator}
            onChange={(e) => setOperator(e.target.value as ProviderKey)}
          >
            {city.operators.map((op) => (
              <option key={op} value={op}>
                {PROVIDER_LABELS[op]}
                {op === 'MOCK' ? ' (simulation)' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Moyen de paiement (libellé)" htmlFor="paymentLabel" hint="Affichage uniquement — aucune donnée bancaire n'est stockée par Parkmind.">
          <Input id="paymentLabel" name="paymentLabel" placeholder="Visa •• 4242" />
        </Field>
        {operator !== 'MOCK' && (
          <Alert tone="info">
            L'intégration officielle {PROVIDER_LABELS[operator]} n'est pas encore
            disponible. Parkmind fonctionnera en <strong>mode simulation</strong>{' '}
            pour cet opérateur jusqu'à l'intégration.
          </Alert>
        )}
      </fieldset>

      {/* Step 4 — Preferences & activation */}
      <fieldset className={cn('flex-col gap-5', step === 4 ? 'flex' : 'hidden')}>
        <label className="flex items-center justify-between rounded-lg border border-border p-4">
          <span>
            <span className="block text-sm font-medium">Mode simulation</span>
            <span className="block text-xs text-muted-foreground">
              Prend les décisions sans dépenser d'argent. Recommandé pour démarrer.
            </span>
          </span>
          <Switch
            name="simulationMode"
            checked={simulation}
            onChange={(e) => setSimulation(e.target.checked)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Plafond / jour (€)" htmlFor="dailyCapEur">
            <Input id="dailyCapEur" name="dailyCapEur" type="number" min={0} step="0.5" defaultValue={10} />
          </Field>
          <Field label="Plafond / mois (€)" htmlFor="monthlyCapEur">
            <Input id="monthlyCapEur" name="monthlyCapEur" type="number" min={0} step="1" defaultValue={100} />
          </Field>
          <Field label="Confirmation au-delà de (€)" htmlFor="confirmationThresholdEur">
            <Input id="confirmationThresholdEur" name="confirmationThresholdEur" type="number" min={0} step="0.5" defaultValue={5} />
          </Field>
        </div>

        {/* Review */}
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <p className="mb-2 font-semibold">Récapitulatif</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>Ville : <span className="text-foreground">{city.name}</span></li>
            <li>Droit : <span className="text-foreground">{RIGHT_TYPE_LABELS[rightType]}</span></li>
            <li>Véhicule : <span className="text-foreground font-mono">{plate ? formatPlate(plate) : '—'}</span></li>
            <li>Zone : <span className="text-foreground">{zoneName}</span></li>
            <li>Jours : <span className="text-foreground">{days.sort((a, b) => a - b).map((d) => DAYS.find((x) => x.v === d)?.l).join(', ')}</span></li>
            <li>Opérateur : <span className="text-foreground">{PROVIDER_LABELS[operator]}</span></li>
            <li>Mode : <span className="text-foreground">{simulation ? 'Simulation' : 'Réel'}</span></li>
          </ul>
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consentAutomation" className="mt-0.5 h-4 w-4 rounded border-input" required />
          <span className="text-muted-foreground">
            Je consens à ce que Parkmind déclenche automatiquement des sessions de
            stationnement selon ces règles, dans la limite de mes plafonds. Je peux
            mettre en pause à tout moment.
          </span>
        </label>
      </fieldset>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4" /> Précédent
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canContinue}
          >
            Continuer <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <SubmitButton size="lg" pendingLabel="Activation…">
            <Check className="h-4 w-4" /> Activer Parkmind
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
