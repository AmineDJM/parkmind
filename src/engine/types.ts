import type { CityRules } from '@/cities/types';
import type {
  DecisionType,
  ProviderKey,
  RightType,
  RightStatus,
} from '@/domain/enums';

/**
 * The Parking Automation Engine is a pure function of its context. It never
 * touches the database, the network, or the UI. The server layer builds a
 * `ParkingContext` from Prisma models and executes the returned decision.
 */

export interface EngineVehicle {
  id: string;
  plate: string;
  displayPlate: string;
  /**
   * Whether the vehicle is believed to be parked in the target zone right now.
   * MVP: derived from the rule (user asserts presence). Future: GPS/geofencing.
   */
  present: boolean;
}

export interface EngineRight {
  id: string;
  type: RightType;
  status: RightStatus;
  startsOn: Date | null;
  expiresOn: Date | null;
}

export interface EngineActiveSession {
  id: string;
  zoneCode: string;
  expiresAt: Date | null;
  simulated: boolean;
}

export interface EngineCaps {
  dailyCapCents: number;
  monthlyCapCents: number;
  confirmationThresholdCents: number;
  spentTodayCents: number;
  spentThisMonthCents: number;
  platformDailyCapCents: number;
  platformMonthlyCapCents: number;
}

export interface EngineFlags {
  /** Global admin kill switch — when true, nothing is ever started. */
  killSwitch: boolean;
  /** Admin master switch for all automations. */
  automationsGloballyEnabled: boolean;
  cityEnabled: boolean;
  providerEnabled: boolean;
  /** User-level master switch (Parkmind actif / en pause). */
  userAutomationEnabled: boolean;
  /** The specific rule is ACTIVE (not paused/disabled). */
  ruleActive: boolean;
  /** Effective simulation mode (no money spent). */
  simulationMode: boolean;
  /** Explicit, logged consent to run automations. */
  consentGiven: boolean;
}

export interface EngineRule {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  maxDurationMinutes: number | null;
}

export interface ParkingContext {
  now: Date;
  city: CityRules;
  /** The zone code (or alias) the rule watches. */
  zoneCode: string;
  operator: ProviderKey;
  vehicle: EngineVehicle;
  right: EngineRight | null;
  rule: EngineRule;
  activeSessions: EngineActiveSession[];
  caps: EngineCaps;
  flags: EngineFlags;
}

export interface DecisionPlan {
  zoneCode: string;
  zoneName: string;
  operator: ProviderKey;
  rightType: RightType;
  tariffCode: string;
  amountCents: number;
  currency: string;
  durationMinutes: number;
  startAt: Date;
  expiresAt: Date;
  simulated: boolean;
}

export type ConfirmationKind =
  | 'NO_CONSENT'
  | 'ZONE_NOT_RECOGNIZED'
  | 'RIGHT_MISSING'
  | 'RIGHT_EXPIRED'
  | 'RIGHT_PENDING'
  | 'RIGHT_NOT_YET_VALID'
  | 'OVER_DAILY_CAP'
  | 'OVER_MONTHLY_CAP'
  | 'AMOUNT_THRESHOLD';

export interface ParkingDecision {
  type: DecisionType;
  /** A short, stable machine code summarizing the outcome. */
  code: string;
  /** Human-readable, explainable reasons. */
  reasons: string[];
  plan?: DecisionPlan;
  targetSessionId?: string;
  confirmation?: {
    kind: ConfirmationKind;
    amountCents?: number;
    message: string;
  };
  error?: { code: string; message: string };
}
