"use client";

import clsx from 'clsx';
import { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ elevated = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-white/5 bg-[#0B0B0B]/80 p-6 text-white transition-all duration-300',
        elevated && 'shadow-neon hover:-translate-y-1 hover:border-brand/40',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
