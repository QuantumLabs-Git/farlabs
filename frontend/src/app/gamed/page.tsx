"use client";

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Cloud, Coins, Wrench } from 'lucide-react';
import { useRevenue } from '@/hooks/useRevenue';
import { formatPercent } from '@/lib/utils/formatters';

const benefits = [
  {
    icon: Wrench,
    title: 'Developer Toolkit',
    description:
      'Integrate smart licensing in minutes with SDKs spanning Unity, Unreal, and Godot.'
  },
  {
    icon: Cloud,
    title: 'Global Distribution',
    description:
      'Multi-region delivery optimized via CloudFront with token-gated downloads and analytics.'
  },
  {
    icon: Coins,
    title: 'Revenue Automation',
    description:
      'Smart contracts split sales between studios, creators, and $FAR stakers automatically.'
  }
];

export default function GameDPage() {
  const { revenue } = useRevenue();

  const gamedStream = revenue?.streams?.find((stream) => stream.id === 'gamed');
  const revenueYield =
    gamedStream?.monthlyReturn !== undefined
      ? gamedStream.monthlyReturn >= 1
        ? `${gamedStream.monthlyReturn.toFixed(2)}%`
        : formatPercent(gamedStream.monthlyReturn)
      : '—';

  const metricCards = useMemo(
    () => [
      { label: 'Titles', value: '—', accent: 'text-white' },
      { label: 'GMV (30d)', value: '—', accent: 'text-brand-soft' },
      { label: 'Revenue Yield', value: revenueYield, accent: 'text-emerald-400' }
    ],
    [revenueYield]
  );

  return (
    <div className="space-y-16">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-white">Far GameD Distribution</h1>
          <p className="text-sm text-white/60">
            Launch, monetize, and iterate on Web3-native games with integrated licensing, token
            gating, and marketplace payouts.
          </p>
          <div className="flex gap-4">
            <Link href="/docs/gamed">
              <Button>Get Started</Button>
            </Link>
            <Link href="/gamed/publish">
              <Button variant="ghost">Publish</Button>
            </Link>
          </div>
        </div>
        <Card elevated className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Publisher Snapshot</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {metricCards.map((metric) => (
              <div key={metric.label}>
                <p className="text-sm text-white/50">{metric.label}</p>
                <p
                  className={`text-2xl font-semibold ${
                    metric.value === '—' ? 'text-white/40' : metric.accent
                  }`}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {benefits.map((benefit) => (
          <Card key={benefit.title} elevated className="space-y-4">
            <benefit.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
            <p className="text-sm text-white/60">{benefit.description}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
