import { nanoid } from 'nanoid';
import { normalizePlate } from '@/lib/utils';
import {
  fail,
  ok,
  type ExtendSessionInput,
  type ParkingProvider,
  type ProviderResult,
  type ProviderSession,
  type StartSessionInput,
  type Tariff,
} from './types';

export interface MockProviderOptions {
  /** Force startSession to fail (simulates a declined payment). */
  failStart?: boolean;
  /** Plates (normalized) whose sessions should be declined. */
  declinePlates?: string[];
  /** Deterministic ids for tests. */
  idFactory?: () => string;
}

/**
 * A fully-functional, in-memory parking operator used for the MVP, tests, demos
 * and Simulation Mode. It behaves like a real operator (idempotent starts,
 * extend/stop/get, tariffs, plate validation) but never contacts a network and
 * never moves real money.
 *
 * Convention for demos/tests: a connectionRef of "FORCE_DECLINE" or a plate in
 * `declinePlates` yields a declined payment, so error/notification paths can be
 * exercised end-to-end.
 */
export class MockParkingProvider implements ParkingProvider {
  readonly key = 'MOCK' as const;
  readonly name = 'Parkmind Mock';
  readonly isImplemented = true;

  private sessions = new Map<string, ProviderSession>();
  private byIdempotency = new Map<string, string>();
  private opts: MockProviderOptions;

  constructor(opts: MockProviderOptions = {}) {
    this.opts = opts;
  }

  private newId(): string {
    return (this.opts.idFactory ?? (() => `mock_${nanoid(12)}`))();
  }

  async startSession(
    input: StartSessionInput,
  ): Promise<ProviderResult<ProviderSession>> {
    // Idempotency: replaying the same key returns the same session.
    const existingId = this.byIdempotency.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.sessions.get(existingId);
      if (existing) return ok(existing);
    }

    const declined =
      this.opts.failStart === true ||
      input.connectionRef === 'FORCE_DECLINE' ||
      (this.opts.declinePlates ?? [])
        .map(normalizePlate)
        .includes(normalizePlate(input.plate));

    if (declined) {
      return fail(
        'PAYMENT_DECLINED',
        'Le moyen de paiement a été refusé par l’opérateur (simulation).',
        false,
      );
    }

    const session: ProviderSession = {
      externalSessionId: this.newId(),
      status: 'ACTIVE',
      startAt: input.startAt,
      expiresAt: input.expiresAt,
      amountCents: input.amountCents,
      currency: input.currency,
      simulated: input.simulated,
    };
    this.sessions.set(session.externalSessionId, session);
    this.byIdempotency.set(input.idempotencyKey, session.externalSessionId);
    return ok(session);
  }

  async extendSession(
    externalSessionId: string,
    input: ExtendSessionInput,
  ): Promise<ProviderResult<ProviderSession>> {
    const s = this.sessions.get(externalSessionId);
    if (!s) return fail('SESSION_NOT_FOUND', 'Session introuvable.');
    if (s.status !== 'ACTIVE')
      return fail('SESSION_NOT_ACTIVE', 'La session n’est plus active.');
    const updated: ProviderSession = {
      ...s,
      expiresAt: input.newExpiresAt,
      amountCents: s.amountCents + input.amountCents,
    };
    this.sessions.set(externalSessionId, updated);
    return ok(updated);
  }

  async stopSession(
    externalSessionId: string,
  ): Promise<ProviderResult<ProviderSession>> {
    const s = this.sessions.get(externalSessionId);
    if (!s) return fail('SESSION_NOT_FOUND', 'Session introuvable.');
    const updated: ProviderSession = {
      ...s,
      status: 'COMPLETED',
      expiresAt: new Date(),
    };
    this.sessions.set(externalSessionId, updated);
    return ok(updated);
  }

  async getSession(
    externalSessionId: string,
  ): Promise<ProviderResult<ProviderSession>> {
    const s = this.sessions.get(externalSessionId);
    if (!s) return fail('SESSION_NOT_FOUND', 'Session introuvable.');
    return ok(s);
  }

  async getTariffs(zoneCode: string): Promise<ProviderResult<Tariff[]>> {
    return ok([
      { code: `${zoneCode}-RES-DAY`, label: 'Résident (journée)', flatDayCents: 150 },
      { code: `${zoneCode}-VIS-H`, label: 'Visiteur (horaire)', perHourCents: 400 },
    ]);
  }

  async validateVehicle(
    plate: string,
  ): Promise<ProviderResult<{ plate: string; valid: boolean }>> {
    const normalized = normalizePlate(plate);
    // A plausible French SIV plate (AA-123-AA) is considered valid.
    const valid = /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(normalized);
    return ok({ plate: normalized, valid });
  }
}
