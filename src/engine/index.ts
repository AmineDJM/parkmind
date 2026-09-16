/**
 * Parkmind — Parking Automation Engine (public surface).
 *
 * Pure, UI- and DB-independent. Consumes a `ParkingContext` and returns an
 * explainable `ParkingDecision`. This is the conceptual core:
 *
 *   user + vehicle + parking_right + location + calendar + city_rules + operator
 *     -> parking_action
 */
export { decide } from './decide';
export { explainDecision, summarizeDecision } from './explain';
export { computeAmountCents } from './pricing';
export type {
  ParkingContext,
  ParkingDecision,
  DecisionPlan,
  ConfirmationKind,
  EngineVehicle,
  EngineRight,
  EngineActiveSession,
  EngineCaps,
  EngineFlags,
  EngineRule,
} from './types';
