import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import { runDueAutomations } from '@/server/executor';
import { logAudit } from '@/server/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const provided =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.headers.get('x-cron-secret') ??
    req.nextUrl.searchParams.get('key') ??
    '';
  const expected = env.cronSecret;
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const started = Date.now();
  // Optional `at` (ISO datetime) lets an authorized caller run the engine as of a
  // specific moment — useful for backfills, replays and testing. Secret-gated.
  const atParam = req.nextUrl.searchParams.get('at');
  const now = atParam ? new Date(atParam) : new Date();
  const runAt = Number.isNaN(now.getTime()) ? new Date() : now;
  const counts = await runDueAutomations(runAt);
  await logAudit({
    actor: 'cron',
    category: 'SYSTEM',
    action: 'CRON_RUN',
    summary: `Cron automation: ${counts.started} activées, ${counts.confirm} à confirmer, ${counts.failed} échecs, ${counts.skipped} ignorées.`,
    data: counts,
  });
  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - started,
    ...counts,
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
