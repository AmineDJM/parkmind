/** Presentation helpers: map domain enums to French labels + badge tones. */

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

export const SESSION_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'En attente', tone: 'neutral' },
  ACTIVE: { label: 'Active', tone: 'success' },
  SIMULATED: { label: 'Simulée', tone: 'info' },
  COMPLETED: { label: 'Terminée', tone: 'neutral' },
  FAILED: { label: 'Échec', tone: 'danger' },
  CANCELED: { label: 'Annulée', tone: 'neutral' },
  REQUIRES_CONFIRMATION: { label: 'À confirmer', tone: 'warning' },
};

export const DECISION_LABEL: Record<string, string> = {
  NO_ACTION: 'Aucune action',
  START_SESSION: 'Session activée',
  EXTEND_SESSION: 'Prolongation',
  STOP_SESSION: 'Arrêt',
  REQUIRE_USER_CONFIRMATION: 'Confirmation requise',
  ERROR: 'Erreur',
};

export const RIGHT_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Actif', tone: 'success' },
  EXPIRING_SOON: { label: 'Bientôt expiré', tone: 'warning' },
  EXPIRED: { label: 'Expiré', tone: 'danger' },
  PENDING_VERIFICATION: { label: 'En vérification', tone: 'warning' },
  REVOKED: { label: 'Révoqué', tone: 'danger' },
};

export const PROVIDER_HEALTH: Record<string, { label: string; tone: Tone }> = {
  OPERATIONAL: { label: 'Opérationnel', tone: 'success' },
  DEGRADED: { label: 'Dégradé', tone: 'warning' },
  DOWN: { label: 'Hors service', tone: 'danger' },
  NOT_IMPLEMENTED: { label: 'Non intégré', tone: 'neutral' },
};

export const NOTIFICATION_LABEL: Record<string, string> = {
  WELCOME: 'Bienvenue',
  SESSION_STARTED: 'Session activée',
  SESSION_EXTENDED: 'Session prolongée',
  SESSION_STOPPED: 'Session arrêtée',
  PAYMENT_FAILED: 'Échec de paiement',
  RIGHT_EXPIRING: 'Droit bientôt expiré',
  RIGHT_EXPIRED: 'Droit expiré',
  ZONE_NOT_RECOGNIZED: 'Zone non reconnue',
  NO_ACTION_NEEDED: 'Aucune action nécessaire',
  CONFIRMATION_REQUIRED: 'Confirmation requise',
  AUTOMATION_SUSPENDED: 'Automatisation suspendue',
  CAP_REACHED: 'Plafond atteint',
  SYSTEM: 'Système',
};

export function notificationTone(type: string): Tone {
  switch (type) {
    case 'SESSION_STARTED':
    case 'SESSION_EXTENDED':
      return 'success';
    case 'PAYMENT_FAILED':
    case 'RIGHT_EXPIRED':
      return 'danger';
    case 'RIGHT_EXPIRING':
    case 'CONFIRMATION_REQUIRED':
    case 'ZONE_NOT_RECOGNIZED':
    case 'CAP_REACHED':
    case 'AUTOMATION_SUSPENDED':
      return 'warning';
    default:
      return 'info';
  }
}

/** Potential FPS (Forfait Post-Stationnement) value used for savings estimates. */
export const FPS_VALUE_EUR = 50;
