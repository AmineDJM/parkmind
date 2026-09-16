/**
 * Worker: triggers the automation engine by calling the secured cron endpoint.
 * This mirrors the production pattern (Render/Vercel cron → HTTP endpoint) and
 * keeps server-only modules inside the Next runtime.
 *
 * Run with:  npm run worker      (requires the app to be running)
 * Env:       NEXT_PUBLIC_APP_URL, CRON_SECRET
 */
import 'dotenv/config';

async function main() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const secret = process.env.CRON_SECRET ?? '';
  const url = `${base}/api/cron/automation`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`[worker] ${res.status} ${url}`);
  console.log(body);
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error('[worker] failed:', e);
  process.exit(1);
});
