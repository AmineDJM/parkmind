import { paris } from '@/cities/paris';
import type {
  EngineCaps,
  EngineFlags,
  EngineRight,
  EngineRule,
  EngineVehicle,
  ParkingContext,
} from '@/engine';
import type { EngineActiveSession } from '@/engine/types';

/**
 * Test context builder. The base context is a valid START scenario:
 * Paris 16e, Monday 2026-01-05 10:00 (Europe/Paris), resident with a valid
 * right, simulation on. Individual tests override only what they need.
 */

// Monday 2026-01-05, 10:00 Europe/Paris (winter, UTC+1) → 09:00 UTC.
export const BASE_NOW = new Date('2026-01-05T09:00:00Z');

export function futureDate(daysFromBase = 365): Date {
  return new Date(BASE_NOW.getTime() + daysFromBase * 86_400_000);
}
export function pastDate(daysBeforeBase = 30): Date {
  return new Date(BASE_NOW.getTime() - daysBeforeBase * 86_400_000);
}

interface Overrides {
  now?: Date;
  zoneCode?: string;
  operator?: ParkingContext['operator'];
  vehicle?: Partial<EngineVehicle>;
  right?: Partial<EngineRight> | null;
  rule?: Partial<EngineRule>;
  activeSessions?: EngineActiveSession[];
  caps?: Partial<EngineCaps>;
  flags?: Partial<EngineFlags>;
}

export function makeContext(o: Overrides = {}): ParkingContext {
  const baseRight: EngineRight = {
    id: 'right_1',
    type: 'RESIDENT',
    status: 'ACTIVE',
    startsOn: null,
    expiresOn: futureDate(365),
  };

  return {
    now: o.now ?? BASE_NOW,
    city: paris,
    zoneCode: o.zoneCode ?? 'paris-16',
    operator: o.operator ?? 'MOCK',
    vehicle: {
      id: 'veh_1',
      plate: 'AA123AA',
      displayPlate: 'AA-123-AA',
      present: true,
      ...o.vehicle,
    },
    right: o.right === null ? null : { ...baseRight, ...o.right },
    rule: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:45',
      endTime: '20:00',
      maxDurationMinutes: null,
      ...o.rule,
    },
    activeSessions: o.activeSessions ?? [],
    caps: {
      dailyCapCents: 1000,
      monthlyCapCents: 10000,
      confirmationThresholdCents: 500,
      spentTodayCents: 0,
      spentThisMonthCents: 0,
      platformDailyCapCents: 2000,
      platformMonthlyCapCents: 20000,
      ...o.caps,
    },
    flags: {
      killSwitch: false,
      automationsGloballyEnabled: true,
      cityEnabled: true,
      providerEnabled: true,
      userAutomationEnabled: true,
      ruleActive: true,
      simulationMode: true,
      consentGiven: true,
      ...o.flags,
    },
  };
}
