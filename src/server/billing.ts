import type { PlanTier } from '@prisma/client';

/**
 * Subscription plans. Billing (Stripe) is optional in the MVP — when Stripe env
 * keys are absent, the app runs in "disabled billing" mode and plans are purely
 * informational. The structure is here so real billing drops in later.
 */
export interface Plan {
  tier: PlanTier;
  name: string;
  tagline: string;
  priceEurMonth: number | null; // null = "sur devis"
  vehicleLimit: number; // Infinity for fleet
  automations: boolean;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    tier: 'FREE',
    name: 'Free / Essai',
    tagline: 'Testez le moteur, sans dépense.',
    priceEurMonth: 0,
    vehicleLimit: 1,
    automations: false,
    features: [
      '1 véhicule',
      'Mode simulation illimité',
      'Alertes (droit expirant, zone non reconnue)',
      'Historique des décisions',
    ],
  },
  {
    tier: 'PARKMIND',
    name: 'Parkmind',
    tagline: 'Le pilote automatique, activé.',
    priceEurMonth: 6.99,
    vehicleLimit: 1,
    automations: true,
    features: [
      '1 véhicule',
      'Automatisations réelles',
      'Plafonds & confirmations',
      'Historique complet',
      'Notifications e-mail',
    ],
    highlighted: true,
  },
  {
    tier: 'PRO',
    name: 'Parkmind Pro',
    tagline: 'Pour les pros et multi-véhicules.',
    priceEurMonth: 12.99,
    vehicleLimit: 5,
    automations: true,
    features: [
      "Jusqu'à 5 véhicules",
      'Droits professionnels',
      'Règles avancées par zone',
      'Support prioritaire',
    ],
  },
  {
    tier: 'FLEET',
    name: 'Fleet',
    tagline: 'Flottes & entreprises.',
    priceEurMonth: null,
    vehicleLimit: Number.POSITIVE_INFINITY,
    automations: true,
    features: [
      'Véhicules illimités',
      'Collaborateurs & rôles',
      'Dashboard entreprise',
      'Facturation centralisée',
    ],
  },
];

export function getPlan(tier: PlanTier): Plan {
  return PLANS.find((p) => p.tier === tier) ?? PLANS[0]!;
}

export function vehicleLimitFor(tier: PlanTier): number {
  return getPlan(tier).vehicleLimit;
}

export function automationsAllowed(tier: PlanTier): boolean {
  return getPlan(tier).automations;
}
