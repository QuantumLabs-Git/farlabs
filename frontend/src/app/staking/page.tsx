"use client";

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StakingCalculator } from '@/components/charts/StakingCalculator';
import Link from 'next/link';
import { ShieldCheck, Sparkle, Wallet } from 'lucide-react';
import { useStakingMetrics } from '@/hooks/useStaking';
import { formatPercent } from '@/lib/utils/formatters';

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Protocol Security',
    description:
      'Stake $FAR to secure revenue distribution and access governance weight across all product lines.'
  },
  {
    icon: Wallet,
    title: 'Revenue Share',
    description:
      'Earn yield from Far Inference, Far GameD, and GPU De-Pin automatically distributed via smart contracts.'
  },
  {
    icon: Sparkle,
    title: 'Multiplier Boosts',
    description:
      'Lock longer to unlock boosted APY, boosted airdrop multipliers, and governance influence.'
  }
];

export default function StakingPage() {
  const { metrics } = useStakingMetrics();

  const metricCards = useMemo(
    () => [
      {
        label: 'Total Value Locked',
        value:
          metrics?.tvl_far !== undefined
            ? `${metrics.tvl_far.toLocaleString()} FAR`
            : '—',
        accent: 'text-white'
      },
      {
        label: 'APY (Base)',
        value:
          metrics?.apy !== undefined ? formatPercent(metrics.apy) : '—',
        accent: 'text-brand-soft'
      },
      {
        label: 'Lockers',
        value:
          metrics?.participants !== undefined
            ? metrics.participants.toLocaleString()
            : '—',
        accent: 'text-white'
      }
    ],
    [metrics]
  );

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-white">$FAR Protocol Staking</h1>
          <p className="max-w-2xl text-sm text-white/60">
            Lock $FAR to activate revenue share across Far Labs products and participate in cross-vertical governance.
          </p>
          <div className="flex gap-4">
            <Link href="/staking/deposit">
              <Button>Stake Now</Button>
            </Link>
            <Link href="/docs/staking">
              <Button variant="ghost">Staking Policy</Button>
            </Link>
          </div>
        </div>
        <Card elevated className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Key Metrics</p>
          <div className="grid gap-4 sm:grid-cols-3">
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

      <StakingCalculator />
    </div>
  );
}
