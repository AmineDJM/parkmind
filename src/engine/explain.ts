import type { ParkingDecision } from './types';

/**
 * Render a decision as a human-readable, explainable block. Used in audit logs,
 * the history view and the admin console.
 *
 *   Decision: START_SESSION
 *   Reason:
 *   - vehicle detected in Paris zone 16
 *   - resident right valid
 *   - ...
 */
export function explainDecision(decision: ParkingDecision): string {
  const lines = [`Decision: ${decision.type}`, 'Reason:'];
  for (const r of decision.reasons) {
    lines.push(`- ${r}`);
  }
  if (decision.plan) {
    const p = decision.plan;
    lines.push(
      `Plan: ${p.zoneName} · ${p.tariffCode} · ${(p.amountCents / 100).toFixed(2)} ${p.currency} · ${p.durationMinutes} min${p.simulated ? ' (simulation)' : ''}`,
    );
  }
  if (decision.confirmation) {
    lines.push(`Confirmation required: ${decision.confirmation.message}`);
  }
  if (decision.error) {
    lines.push(`Error: ${decision.error.code} — ${decision.error.message}`);
  }
  return lines.join('\n');
}

/** One-line summary for tables/notifications. */
export function summarizeDecision(decision: ParkingDecision): string {
  return decision.reasons[0] ?? decision.type;
}
