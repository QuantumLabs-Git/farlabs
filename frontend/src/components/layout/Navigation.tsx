"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inference', label: 'Inference' },
  { href: '/gaming', label: 'Gaming' },
  { href: '/desci', label: 'DeSci' },
  { href: '/staking', label: 'Staking' },
  { href: '/docs', label: 'Docs' }
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-xl md:flex">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'group relative mx-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300',
              isActive
                ? 'text-white'
                : 'text-white/70 hover:text-white hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]'
            )}
          >
            <span
              className={clsx(
                'absolute inset-0 -z-10 scale-95 rounded-full bg-white/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100',
                isActive && 'scale-100 bg-brand/40 opacity-100'
              )}
            />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
