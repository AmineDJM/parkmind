import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { SESSION_STATUS } from '@/lib/display';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-soft',
        accent && 'bg-brand-soft',
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-1.5 text-2xl font-bold tracking-tight', accent && 'text-brand')}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          {icon}
        </div>
      )}
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SessionStatusBadge({ status }: { status: string }) {
  const s = SESSION_STATUS[status] ?? { label: status, tone: 'neutral' as const };
  return <Badge variant={s.tone}>{s.label}</Badge>;
}

export function ReasonList({ reasons }: { reasons: string[] }) {
  if (!reasons?.length) return null;
  return (
    <ul className="space-y-1 text-sm text-muted-foreground">
      {reasons.map((r, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  );
}
