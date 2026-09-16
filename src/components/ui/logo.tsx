import { cn } from '@/lib/utils';

/** Parkmind mark: a calm rounded badge with the universal parking "P" and a
 *  small automation orbit dot — mobility + intelligence. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('h-8 w-8', className)}
      role="img"
      aria-label="Parkmind"
    >
      <defs>
        <linearGradient id="pm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(162 84% 44%)" />
          <stop offset="100%" stopColor="hsl(180 82% 34%)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#pm-grad)" />
      <path
        d="M14 11h7.4c3.7 0 6.3 2.4 6.3 5.9 0 3.6-2.7 6-6.5 6H18v6.1h-4V11zm4 8.3h3c1.6 0 2.6-.9 2.6-2.4 0-1.5-1-2.3-2.6-2.3h-3v4.7z"
        fill="white"
      />
      <circle cx="29.5" cy="10.5" r="2.6" fill="white" opacity="0.92" />
    </svg>
  );
}

export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {withWordmark && (
        <span className="text-[1.15rem] font-bold tracking-tight text-foreground">
          Parkmind
        </span>
      )}
    </span>
  );
}
