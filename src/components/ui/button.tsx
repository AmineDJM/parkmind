import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant =
  | 'brand'
  | 'outline'
  | 'ghost'
  | 'subtle'
  | 'danger'
  | 'success'
  | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  brand:
    'bg-brand text-brand-foreground hover:bg-brand/90 shadow-soft focus-visible:ring-brand',
  outline:
    'border border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring',
  ghost: 'text-foreground hover:bg-muted focus-visible:ring-ring',
  subtle: 'bg-muted text-foreground hover:bg-muted/70 focus-visible:ring-ring',
  danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger',
  success: 'bg-success text-white hover:bg-success/90 focus-visible:ring-success',
  link: 'text-brand underline-offset-4 hover:underline px-0',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-md gap-1.5',
  md: 'h-11 px-5 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2',
  icon: 'h-10 w-10 rounded-lg',
};

export function buttonVariants({
  variant = 'brand',
  size = 'md',
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none',
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
