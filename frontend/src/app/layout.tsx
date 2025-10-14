"use client";

import '@/styles/globals.css';
import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from 'next-themes';
import { Web3Provider } from '@/providers/web3-provider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#050505] text-white selection:bg-brand/60 selection:text-white">
        <Web3Provider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <div className="relative min-h-screen overflow-hidden">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-glow" />
              <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%)] mix-blend-soft-light" />
              <Header />
              <div className="mx-auto max-w-7xl px-6 pb-24 pt-24">{children}</div>
              <Footer />
            </div>
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
