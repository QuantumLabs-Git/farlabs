"use client";

import clsx from 'clsx';
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand via-brand to-brand-soft text-white shadow-neon hover:-translate-y-0.5',
  ghost: 'bg-white/5 text-white hover:bg-white/10',
  outline: 'border border-white/20 text-white hover:border-brand hover:text-brand-soft'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-4 py-2 rounded-full',
  md: 'text-sm px-5 py-2.5 rounded-full',
  lg: 'text-base px-6 py-3 rounded-full'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    disabled,
    asChild = false,
    ...props
  },
  ref
) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      ref={ref as never}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'cursor-not-allowed opacity-70',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
      )}
      {children}
    </Component>
  );
});
