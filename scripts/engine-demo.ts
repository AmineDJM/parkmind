/**
 * Standalone demonstration of the PURE automation engine (no database).
 * Run with:  npm run engine:demo
 */
import { decide, explainDecision, type ParkingContext } from '@/engine';
import { paris } from '@/cities/paris';

// Monday 2026-01-05, 10:00 Europe/Paris.
const NOW = new Date('2026-01-05T09:00:00Z');

function ctx(over: Partial<ParkingContext> = {}): ParkingContext {
  return {
    now: NOW,
    city: paris,
    zoneCode: 'paris-16',
    operator: 'MOCK',
    vehicle: { id: 'v', plate: 'AA123AA', displayPlate: 'AA-123-AA', present: true },
    right: { id: 'r', type: 'RESIDENT', status: 'ACTIVE', startsOn: null, expiresOn: new Date('2027-01-01') },
    rule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: '08:45', endTime: '20:00', maxDurationMinutes: null },
    activeSessions: [],
    caps: {
      dailyCapCents: 1000,
      monthlyCapCents: 10000,
      confirmationThresholdCents: 500,
      spentTodayCents: 0,
      spentThisMonthCents: 0,
      platformDailyCapCents: 2000,
      platformMonthlyCapCents: 20000,
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
    },
    ...over,
  };
}

const scenarios: Array<[string, ParkingContext]> = [
  ['Résident, lundi 10:00 (nominal)', ctx()],
  ['Jour férié (1er mai)', ctx({ now: new Date('2026-05-01T09:00:00Z') })],
  ['Dimanche (gratuit)', ctx({ now: new Date('2026-01-04T10:00:00Z') })],
  ['Droit expiré', ctx({ right: { id: 'r', type: 'RESIDENT', status: 'EXPIRED', startsOn: null, expiresOn: null } })],
  ['Dépassement de plafond', ctx({ caps: { ...ctx().caps, dailyCapCents: 100 } })],
  ['Automatisation en pause', ctx({ flags: { ...ctx().flags, userAutomationEnabled: false } })],
];

console.log('\n=== Parkmind — démonstration du moteur ===\n');
for (const [label, c] of scenarios) {
  console.log(`▸ ${label}`);
  console.log(
    explainDecision(decide(c))
      .split('\n')
      .map((l) => '  ' + l)
      .join('\n'),
  );
  console.log('');
}
