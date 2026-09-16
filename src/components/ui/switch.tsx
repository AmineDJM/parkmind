import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Accessible toggle built on a native checkbox (peer), so it works inside
 * server-action forms with no client JS. Use `name`/`defaultChecked`.
 */
export const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <label className={cn('relative inline-flex cursor-pointer items-center', className)}>
    <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
    <span className="h-6 w-11 rounded-full bg-input transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50" />
    <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform peer-checked:translate-x-5" />
  </label>
));
Switch.displayName = 'Switch';
