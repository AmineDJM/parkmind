import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'muted' | 'brand';

const tones: Record<Tone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  muted: 'bg-muted-foreground',
  brand: 'bg-brand',
};

export function StatusDot({
  tone = 'success',
  pulse = false,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full',
        tones[tone],
        pulse && 'animate-pulse-ring',
        className,
      )}
    />
  );
}
