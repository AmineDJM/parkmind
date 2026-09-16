import { describe, it, expect } from 'vitest';
import { MockParkingProvider, getProvider } from '@/providers';
import type { StartSessionInput } from '@/providers';

function startInput(over: Partial<StartSessionInput> = {}): StartSessionInput {
  return {
    idempotencyKey: 'idem_1',
    plate: 'AA123AA',
    zoneCode: 'paris-16',
    tariffCode: 'PAR-RES-DAY',
    amountCents: 150,
    currency: 'EUR',
    durationMinutes: 600,
    startAt: new Date('2026-01-05T09:00:00Z'),
    expiresAt: new Date('2026-01-05T19:00:00Z'),
    connectionRef: null,
    simulated: true,
    ...over,
  };
}

describe('MockParkingProvider', () => {
  it('starts a session and returns an external id', async () => {
    const p = new MockParkingProvider();
    const res = await p.startSession(startInput());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.status).toBe('ACTIVE');
      expect(res.data.externalSessionId).toMatch(/^mock_/);
      expect(res.data.amountCents).toBe(150);
    }
  });

  it('is idempotent: same key returns the same session', async () => {
    const p = new MockParkingProvider();
    const a = await p.startSession(startInput({ idempotencyKey: 'same' }));
    const b = await p.startSession(startInput({ idempotencyKey: 'same' }));
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.data.externalSessionId).toBe(b.data.externalSessionId);
    }
  });

  it('declines when forced (simulated payment refusal)', async () => {
    const p = new MockParkingProvider({ failStart: true });
    const res = await p.startSession(startInput());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('PAYMENT_DECLINED');
  });

  it('declines via the FORCE_DECLINE connection ref', async () => {
    const p = new MockParkingProvider();
    const res = await p.startSession(startInput({ connectionRef: 'FORCE_DECLINE' }));
    expect(res.ok).toBe(false);
  });

  it('extends and stops an active session', async () => {
    const p = new MockParkingProvider();
    const started = await p.startSession(startInput({ idempotencyKey: 'x' }));
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const id = started.data.externalSessionId;

    const extended = await p.extendSession(id, {
      idempotencyKey: 'x-ext',
      additionalMinutes: 60,
      newExpiresAt: new Date('2026-01-05T20:00:00Z'),
      amountCents: 100,
      simulated: true,
    });
    expect(extended.ok).toBe(true);
    if (extended.ok) expect(extended.data.amountCents).toBe(250);

    const stopped = await p.stopSession(id);
    expect(stopped.ok).toBe(true);
    if (stopped.ok) expect(stopped.data.status).toBe('COMPLETED');
  });

  it('validates a well-formed French plate', async () => {
    const p = new MockParkingProvider();
    const ok = await p.validateVehicle('AA-123-AA');
    const bad = await p.validateVehicle('???');
    expect(ok.ok && ok.data.valid).toBe(true);
    expect(bad.ok && bad.data.valid).toBe(false);
  });
});

describe('Provider registry — stub adapters never fake success', () => {
  it('MOCK is implemented', () => {
    expect(getProvider('MOCK').isImplemented).toBe(true);
  });

  it.each(['PAYBYPHONE', 'EASYPARK', 'INDIGO_NEO', 'FLOWBIRD'] as const)(
    '%s is a stub and returns NOT_IMPLEMENTED',
    async (key) => {
      const p = getProvider(key);
      expect(p.isImplemented).toBe(false);
      const res = await p.startSession(startInput());
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_IMPLEMENTED');
    },
  );
});
