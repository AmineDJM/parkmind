import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<Tone, string> = {
  info: 'border-info/30 bg-info/8 text-info',
  success: 'border-success/30 bg-success/8 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/8 text-danger',
  brand: 'border-brand/30 bg-brand-soft text-brand',
};

export function Alert({
  tone = 'info',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border px-4 py-3 text-sm [&_a]:underline',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
