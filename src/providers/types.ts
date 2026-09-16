import type { ProviderKey } from '@/domain/enums';

/**
 * The operator abstraction. Every parking operator (PayByPhone, EasyPark,
 * Indigo Neo, Flowbird, …) is integrated behind this single interface, so the
 * rest of Parkmind never knows which operator it is talking to. Swapping the
 * Mock for a real adapter requires zero changes outside `src/providers`.
 */

export interface StartSessionInput {
  /** Guarantees at-most-once execution across retries. */
  idempotencyKey: string;
  plate: string;
  zoneCode: string;
  tariffCode: string;
  amountCents: number;
  currency: string;
  durationMinutes: number;
  startAt: Date;
  expiresAt: Date;
  /** Opaque reference to the user's operator account/token. Never credentials. */
  connectionRef?: string | null;
  /** When true, the provider must not move any real money. */
  simulated: boolean;
}

export interface ExtendSessionInput {
  idempotencyKey: string;
  additionalMinutes: number;
  newExpiresAt: Date;
  amountCents: number;
  simulated: boolean;
}

export interface ProviderSession {
  externalSessionId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  startAt: Date;
  expiresAt: Date;
  amountCents: number;
  currency: string;
  simulated: boolean;
}

export interface Tariff {
  code: string;
  label: string;
  perHourCents?: number;
  flatDayCents?: number;
}

export interface ProviderError {
  code: string;
  message: string;
  /** Whether the executor may safely retry this call. */
  retryable: boolean;
}

export type ProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ProviderError };

export interface ParkingProvider {
  readonly key: ProviderKey;
  readonly name: string;
  /** False for stub adapters awaiting an official API integration. */
  readonly isImplemented: boolean;

  startSession(input: StartSessionInput): Promise<ProviderResult<ProviderSession>>;
  extendSession(
    externalSessionId: string,
    input: ExtendSessionInput,
  ): Promise<ProviderResult<ProviderSession>>;
  stopSession(externalSessionId: string): Promise<ProviderResult<ProviderSession>>;
  getSession(externalSessionId: string): Promise<ProviderResult<ProviderSession>>;
  getTariffs(zoneCode: string): Promise<ProviderResult<Tariff[]>>;
  validateVehicle(
    plate: string,
  ): Promise<ProviderResult<{ plate: string; valid: boolean }>>;
}

export function ok<T>(data: T): ProviderResult<T> {
  return { ok: true, data };
}

export function fail<T>(
  code: string,
  message: string,
  retryable = false,
): ProviderResult<T> {
  return { ok: false, error: { code, message, retryable } };
}
