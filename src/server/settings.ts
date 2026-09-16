import 'server-only';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { logAudit } from './audit';

/**
 * Runtime system settings. Env vars provide the bootstrap defaults; a DB
 * `SystemSetting` row overrides them at runtime so an admin can flip the global
 * kill switch or pause all automations without a redeploy.
 */
export const SETTING_KEYS = {
  KILL_SWITCH: 'KILL_SWITCH',
  AUTOMATIONS_ENABLED: 'AUTOMATIONS_GLOBALLY_ENABLED',
} as const;

export interface SystemFlags {
  killSwitch: boolean;
  automationsGloballyEnabled: boolean;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true';
}

export async function getSystemFlags(): Promise<SystemFlags> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: [SETTING_KEYS.KILL_SWITCH, SETTING_KEYS.AUTOMATIONS_ENABLED] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    killSwitch: parseBool(map.get(SETTING_KEYS.KILL_SWITCH), env.killSwitch),
    automationsGloballyEnabled: parseBool(
      map.get(SETTING_KEYS.AUTOMATIONS_ENABLED),
      true,
    ),
  };
}

export async function setSystemFlag(
  key: string,
  value: boolean,
  updatedBy: string,
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: String(value), updatedBy },
    create: { key, value: String(value), updatedBy },
  });
  await logAudit({
    actor: updatedBy,
    category: 'ADMIN',
    action: 'SYSTEM_SETTING_UPDATED',
    summary: `${key} = ${value}`,
    entityType: 'SystemSetting',
    entityId: key,
  });
}
