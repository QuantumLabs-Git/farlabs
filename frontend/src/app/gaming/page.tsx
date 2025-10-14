"use client";

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Award, Gamepad, Gift, Trophy } from 'lucide-react';
import { useStakingMetrics } from '@/hooks/useStaking';
import { formatPercent } from '@/lib/utils/formatters';

const highlights = [
  {
    icon: Gamepad,
    title: 'AAA Gameplay',
    description:
      'Farcana bridges Unreal Engine 5 experiences with on-chain asset ownership and playable NFTs.'
  },
  {
    icon: Trophy,
    title: 'Transparent Tournaments',
    description:
      'Provably fair tournaments with automated prize pools streamed directly to stakers.'
  },
  {
    icon: Gift,
    title: 'Marketplace',
    description:
      'Peer-to-peer marketplace with royalty splits routed through the Revenue Distribution contract.'
  },
  {
    icon: Award,
    title: 'Creator Tools',
    description:
      'No-code modding toolkit enabling player-built arenas with revenue sharing activated by $FAR.'
  }
];

export default function GamingPage() {
  const { metrics: stakingMetrics } = useStakingMetrics();

  const stakerYield = stakingMetrics?.apy !== undefined ? formatPercent(stakingMetrics.apy) : '—';

  const metricCards = useMemo(
    () => [
      { label: 'Daily Players', value: '—', accent: 'text-white' },
      { label: 'NFT Volume (24h)', value: '—', accent: 'text-brand-soft' },
      { label: 'Staker Yield', value: stakerYield, accent: 'text-emerald-400' }
    ],
    [stakerYield]
  );

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-white">Farcana Gaming Ecosystem</h1>
          <p className="text-sm text-white/60">
            Competitive blockchain gaming fused with smart-contract guaranteed rewards and open
            economy design. Share in revenue via $FAR staking or deploy new game experiences with
            SDK integrations.
          </p>
          <div className="flex gap-4">
            <Button disabled className="cursor-not-allowed opacity-60">
              Developer Docs
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                Coming Soon
              </span>
            </Button>
            <Button variant="ghost" disabled className="cursor-not-allowed opacity-60">
              Marketplace
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                Coming Soon
              </span>
            </Button>
          </div>
        </div>
        <Card elevated className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Protocol Metrics</p>
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

      <section className="grid gap-6 md:grid-cols-2">
        {highlights.map((highlight) => (
          <Card key={highlight.title} elevated className="space-y-4">
            <highlight.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="text-xl font-semibold text-white">{highlight.title}</h3>
            <p className="text-sm text-white/60">{highlight.description}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
