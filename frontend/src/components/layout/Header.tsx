"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Navigation } from '@/components/layout/Navigation';
import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { WalletConnect } from '@/components/web3/WalletConnect';

export function Header() {
  const [isScrolled, setScrolled] = useState(false);

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 24);
  }, []);

  useEffect(() => {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-4 z-50 flex justify-center px-6 transition-all duration-500',
        isScrolled ? 'translate-y-0 opacity-100' : 'opacity-100'
      )}
    >
      <div
        className={clsx(
          'glass-panel flex w-full max-w-6xl items-center justify-between gap-6 rounded-3xl px-6 py-4 transition-all duration-300',
          isScrolled ? 'border border-brand/30 shadow-neon backdrop-blur-3xl' : 'border border-white/10 backdrop-blur-2xl'
        )}
      >
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/farlabs-logo.png"
            alt="Far Labs"
            width={160}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <Navigation />
        <div className="flex items-center gap-3">
          <WalletConnect />
          <Link
            href="/staking"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand via-brand to-brand-soft px-5 py-2 text-sm font-semibold text-white shadow-neon transition-transform duration-300 hover:-translate-y-0.5"
          >
            Stake $FAR
          </Link>
        </div>
      </div>
    </header>
  );
}
