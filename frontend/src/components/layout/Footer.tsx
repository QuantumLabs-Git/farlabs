"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const footerLinks = [
  { title: 'Products', items: [{ label: 'Far Inference', href: '/inference' }, { label: 'FarTwin AI', href: '/fartwin' }, { label: 'Far GameD', href: '/gamed' }] },
  { title: 'Developers', items: [{ label: 'SDK', href: '/docs/sdk' }, { label: 'API Reference', href: '/docs/api' }, { label: 'Smart Contracts', href: '/docs/contracts' }] },
  { title: 'Company', items: [{ label: 'About', href: '/about' }, { label: 'Careers', href: '/careers' }, { label: 'Contact', href: '/contact' }] }
];

export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="relative border-t border-white/5 bg-[#050505]/80">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.3em] text-white/90">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-soft text-lg shadow-lg">
                FL
              </span>
              FAR LABS
            </Link>
            <p className="max-w-sm text-sm text-white/60">
              Enabling decentralized intelligence, scientific advancement, and digital economies powered by the $FAR token.
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-white/30">© {new Date().getFullYear()} Far Labs. All rights reserved.</p>
          </div>
          <div className="md:col-span-7 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {footerLinks.map((group) => (
              <div key={group.title} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">{group.title}</p>
                <div className="flex flex-col space-y-2 text-sm">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`transition-colors duration-200 hover:text-white ${pathname === item.href ? 'text-white' : 'text-white/60'}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
