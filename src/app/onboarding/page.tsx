import type { Metadata } from 'next';
import { listCityRules } from '@/cities';
import {
  OnboardingWizard,
  type CityOption,
} from '@/components/onboarding/onboarding-wizard';

export const metadata: Metadata = { title: 'Configuration' };

export default function OnboardingPage() {
  const cities: CityOption[] = listCityRules().map((c) => ({
    slug: c.slug,
    name: c.name,
    status: c.status,
    zones: c.zones.map((z) => ({ code: z.code, name: z.name })),
    operators: c.operators,
    rights: c.rights.map((r) => ({ type: r.type, label: r.label })),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Configurons votre pilote automatique
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quelques étapes, une seule fois. Ensuite, vous n'y pensez plus.
        </p>
      </div>
      <OnboardingWizard cities={cities} />
    </div>
  );
}
