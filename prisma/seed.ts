import 'dotenv/config';
import { PrismaClient, type Prisma } from '@prisma/client';
import { listCityRules, getCityRules, findZoneInCity } from '../src/cities';
import { PROVIDER_CATALOG } from '../src/providers';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

// Kept in sync with src/server/settings.ts (imported directly would pull in
// `server-only`, which cannot run under the tsx seed process).
const SETTING_KEYS = {
  KILL_SWITCH: 'KILL_SWITCH',
  AUTOMATIONS_ENABLED: 'AUTOMATIONS_GLOBALLY_ENABLED',
} as const;

const DEMO_EMAIL = 'demo@parkmind.app';
const DEMO_PASSWORD = 'parkmind';

function at(daysAgo: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

async function seedCatalog() {
  // Cities + zones from the code config (source of truth).
  for (const city of listCityRules()) {
    const row = await prisma.city.upsert({
      where: { slug: city.slug },
      update: { name: city.name, timezone: city.timezone, currency: city.currency },
      create: {
        slug: city.slug,
        name: city.name,
        country: city.country,
        timezone: city.timezone,
        currency: city.currency,
      },
    });
    for (const zone of city.zones) {
      await prisma.parkingZone.upsert({
        where: { cityId_code: { cityId: row.id, code: zone.code } },
        update: { name: zone.name, kind: zone.kind, isPaid: zone.isPaid },
        create: {
          cityId: row.id,
          code: zone.code,
          name: zone.name,
          kind: zone.kind,
          isPaid: zone.isPaid,
        },
      });
    }
  }

  // Operators.
  for (const p of PROVIDER_CATALOG) {
    await prisma.parkingProvider.upsert({
      where: { key: p.key },
      update: {
        name: p.name,
        isImplemented: p.isImplemented,
        health: p.health,
        website: p.website ?? null,
        notes: p.notes ?? null,
      },
      create: {
        key: p.key,
        name: p.name,
        isImplemented: p.isImplemented,
        health: p.health,
        website: p.website ?? null,
        notes: p.notes ?? null,
      },
    });
  }

  // System settings defaults.
  for (const [key, value] of [
    [SETTING_KEYS.KILL_SWITCH, 'false'],
    [SETTING_KEYS.AUTOMATIONS_ENABLED, 'true'],
  ] as const) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value, description: 'Bootstrap default' },
    });
  }
}

async function seedDemo() {
  // Fresh demo user each run (cascade deletes children).
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const paris = getCityRules('paris')!;
  const zoneCfg = findZoneInCity(paris, 'paris-16')!;
  const cityRow = await prisma.city.findUniqueOrThrow({ where: { slug: 'paris' } });
  const zoneRow = await prisma.parkingZone.findUniqueOrThrow({
    where: { cityId_code: { cityId: cityRow.id, code: zoneCfg.code } },
  });
  const mock = await prisma.parkingProvider.findUniqueOrThrow({ where: { key: 'MOCK' } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Amine',
      passwordHash: await hashPassword(DEMO_PASSWORD),
      role: 'ADMIN',
      planTier: 'PARKMIND',
      emailVerifiedAt: new Date(),
      onboardedAt: at(30, 9),
      preferences: {
        create: {
          simulationMode: true,
          automationEnabled: true,
          dailyCapCents: 1000,
          monthlyCapCents: 10000,
          confirmationThresholdCents: 500,
          consentAutomationAt: at(30, 9),
        },
      },
      consents: {
        create: {
          kind: 'AUTOMATION',
          granted: true,
          version: '2026-01',
        },
      },
    },
  });

  const connection = await prisma.providerConnection.create({
    data: {
      userId: user.id,
      providerId: mock.id,
      label: 'Parkmind Mock',
      status: 'CONNECTED',
      paymentMethodLabel: 'Visa •• 4242',
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: user.id,
      plate: 'AA123AA',
      displayPlate: 'AA-123-AA',
      model: 'Peugeot 208',
      cityId: cityRow.id,
      defaultZoneId: zoneRow.id,
      providerConnectionId: connection.id,
    },
  });

  await prisma.parkingRight.create({
    data: {
      userId: user.id,
      vehicleId: vehicle.id,
      cityId: cityRow.id,
      zoneId: zoneRow.id,
      type: 'RESIDENT',
      status: 'ACTIVE',
      reference: 'RES-750116-2026',
      startsOn: at(365, 0),
      expiresOn: at(-320, 0), // ~11 months in the future
    },
  });

  const rule = await prisma.automationRule.create({
    data: {
      userId: user.id,
      vehicleId: vehicle.id,
      cityId: cityRow.id,
      zoneId: zoneRow.id,
      providerConnectionId: connection.id,
      name: 'Paris · Paris 16e',
      status: 'ACTIVE',
      simulationMode: true,
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:45',
      endTime: '20:00',
      lastRunAt: at(0, 9),
    },
  });

  const reasons = [
    'véhicule AA-123-AA présent dans Paris 16e',
    'droit Résident valide',
    "stationnement payant actif aujourd'hui",
    'aucune session active',
    'tarif applicable : PAR-RES-DAY — 1,50 € pour 660 min',
    'mode simulation : aucun paiement réel',
  ];

  const base = {
    userId: user.id,
    vehicleId: vehicle.id,
    cityId: cityRow.id,
    zoneId: zoneRow.id,
    providerId: mock.id,
    providerConnectionId: connection.id,
    automationRuleId: rule.id,
    origin: 'AUTOMATION' as const,
    tariffCode: 'PAR-RES-DAY',
    currency: 'EUR',
    decisionReasons: reasons as unknown as Prisma.InputJsonValue,
  };

  // Historical simulated sessions on recent weekdays.
  const dayOffsets = [11, 10, 9, 8, 4, 3, 2, 1];
  let seq = 0;
  for (const off of dayOffsets) {
    const start = at(off, 9);
    const end = at(off, 19);
    const key = `seed:${vehicle.id}:${off}:${seq++}`;
    await prisma.parkingSession.create({
      data: {
        ...base,
        status: 'COMPLETED',
        simulated: true,
        decisionType: 'START_SESSION',
        amountCents: 150,
        startedAt: start,
        expiresAt: end,
        endedAt: end,
        externalSessionId: `mock_seed_${off}`,
        idempotencyKey: key,
        payment: {
          create: {
            userId: user.id,
            providerId: mock.id,
            status: 'SIMULATED',
            amountCents: 150,
            currency: 'EUR',
            simulated: true,
            idempotencyKey: `pay:${key}`,
          },
        },
      },
    });
  }

  // A failed payment (declined) for the error demo.
  const failKey = `seed:${vehicle.id}:fail`;
  const failed = await prisma.parkingSession.create({
    data: {
      ...base,
      status: 'FAILED',
      simulated: true,
      decisionType: 'START_SESSION',
      amountCents: 150,
      startedAt: at(7, 9),
      expiresAt: at(7, 19),
      idempotencyKey: failKey,
      errorCode: 'PAYMENT_DECLINED',
      errorMessage: "Le moyen de paiement a été refusé par l'opérateur (simulation).",
      payment: {
        create: {
          userId: user.id,
          providerId: mock.id,
          status: 'FAILED',
          amountCents: 150,
          currency: 'EUR',
          simulated: true,
          failureReason: 'Carte refusée (simulation).',
          idempotencyKey: `pay:${failKey}`,
        },
      },
    },
  });

  // A pending confirmation (over cap) for the alert demo.
  const confirmKey = `seed:${vehicle.id}:confirm`;
  const confirm = await prisma.parkingSession.create({
    data: {
      ...base,
      status: 'REQUIRES_CONFIRMATION',
      simulated: true,
      decisionType: 'REQUIRE_USER_CONFIRMATION',
      decisionReasons: [
        'Dépense du jour : 9,80 € + 1,50 € > plafond 10,00 €.',
      ] as unknown as Prisma.InputJsonValue,
      amountCents: 150,
      startedAt: at(5, 9),
      idempotencyKey: confirmKey,
    },
  });

  // An active simulated session for today, so the dashboard is lively.
  const now = new Date();
  const todayKey = `seed:${vehicle.id}:today`;
  await prisma.parkingSession.create({
    data: {
      ...base,
      status: 'SIMULATED',
      simulated: true,
      decisionType: 'START_SESSION',
      amountCents: 150,
      startedAt: new Date(now.getTime() - 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      externalSessionId: 'mock_seed_today',
      idempotencyKey: todayKey,
      payment: {
        create: {
          userId: user.id,
          providerId: mock.id,
          status: 'SIMULATED',
          amountCents: 150,
          currency: 'EUR',
          simulated: true,
          idempotencyKey: `pay:${todayKey}`,
        },
      },
    },
  });

  // Notifications.
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'WELCOME',
        title: 'Bienvenue sur Parkmind',
        body: 'Votre pilote automatique est configuré pour Paris 16e.',
        createdAt: at(30, 9),
        readAt: at(30, 10),
      },
      {
        userId: user.id,
        type: 'SESSION_STARTED',
        title: 'Stationnement simulé',
        body: 'Paris 16e — 09:00 → 19:00 · 1,50 € (simulation)',
        createdAt: at(1, 9),
      },
      {
        userId: user.id,
        type: 'PAYMENT_FAILED',
        title: 'Échec du paiement',
        body: "Le stationnement à Paris 16e n'a pas pu être activé : carte refusée (simulation).",
        sessionId: failed.id,
        createdAt: at(7, 9),
      },
      {
        userId: user.id,
        type: 'CONFIRMATION_REQUIRED',
        title: 'Intervention requise',
        body: 'Un paiement dépasserait votre plafond journalier. Confirmation requise.',
        sessionId: confirm.id,
        createdAt: at(5, 9),
      },
      {
        userId: user.id,
        type: 'RIGHT_EXPIRING',
        title: 'Droit bientôt expiré',
        body: 'Votre droit résident Paris expire dans moins de 30 jours (exemple).',
        createdAt: at(2, 9),
      },
    ],
  });

  // Audit trail sample.
  await prisma.auditLog.createMany({
    data: [
      {
        userId: user.id,
        actor: user.id,
        category: 'ADMIN',
        action: 'ONBOARDING_COMPLETED',
        summary: 'Onboarding terminé — Paris · Paris 16e',
        entityType: 'AutomationRule',
        entityId: rule.id,
        createdAt: at(30, 9),
      },
      {
        userId: user.id,
        actor: 'system',
        category: 'ENGINE_DECISION',
        action: 'DECISION_START_SESSION',
        summary: 'véhicule AA-123-AA présent dans Paris 16e',
        decisionType: 'START_SESSION',
        entityType: 'AutomationRule',
        entityId: rule.id,
        createdAt: at(1, 9),
      },
      {
        userId: user.id,
        actor: 'system',
        category: 'PAYMENT',
        action: 'SESSION_FAILED',
        summary: 'Échec Paris 16e — PAYMENT_DECLINED',
        decisionType: 'START_SESSION',
        entityType: 'ParkingSession',
        entityId: failed.id,
        createdAt: at(7, 9),
      },
    ],
  });

  return { user, vehicle, rule };
}

async function main() {
  console.log('🌱 Seeding Parkmind…');
  await seedCatalog();
  console.log('  ✓ cities, zones, operators, settings');
  const { vehicle } = await seedDemo();
  console.log(`  ✓ demo user + ${vehicle.displayPlate} + history`);
  console.log('\n✅ Seed terminé.');
  console.log(`   Connexion démo :  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}  (rôle ADMIN)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
