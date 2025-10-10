'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Cpu, Server, Timer, Wifi } from 'lucide-react';
import { useGpuNodes, useGpuStats } from '@/hooks/useGpuNodes';
import { GpuStatsOverview } from '@/components/gpu/GpuStatsOverview';
import { GpuRegistrationForm } from '@/components/gpu/GpuRegistrationForm';
import { GpuNodesTable } from '@/components/gpu/GpuNodesTable';

const tiers = [
  { name: 'Edge', specs: 'RTX 4090 • 24GB VRAM', rate: '$4.20/hr', score: 'Reliability 92' },
  { name: 'Enterprise', specs: 'A100 80GB • NVLink', rate: '$12.80/hr', score: 'Reliability 96' },
  { name: 'Hyperscale', specs: 'H100 80GB • DGX', rate: '$24.10/hr', score: 'Reliability 98' }
];

export default function GpuPage() {
  const { nodes, refresh } = useGpuNodes();
  const { stats } = useGpuStats();

  return (
    <div className="space-y-16">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-white">Far GPU De-Pin</h1>
          <p className="text-sm text-white/60">
            Monetize idle GPU capacity or rent compute in seconds. All payments secured by
            on-chain escrows and performance-weighted rewards.
          </p>
          <div className="flex gap-4">
            <Link href="/gpu/download">
              <Button>Download Worker</Button>
            </Link>
            <Link href="/gpu/onboard">
              <Button variant="ghost">Onboard GPU</Button>
            </Link>
            <Link href="/docs/gpu">
              <Button variant="ghost">Operator Docs</Button>
            </Link>
          </div>
        </div>
        <Card elevated className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Tiered Pricing</p>
          <div className="space-y-4">
            {tiers.map((tier) => (
              <div key={tier.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{tier.name}</p>
                  <p className="text-sm text-brand-soft">{tier.rate}</p>
                </div>
                <p className="text-xs text-white/50">{tier.specs}</p>
                <p className="mt-2 text-xs text-emerald-400">{tier.score}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Cpu, title: 'Dynamic Scheduling', description: 'AI-driven load balancer aligns workloads with VRAM availability and bandwidth.' },
          { icon: Timer, title: 'Streaming Rewards', description: 'Rewards stream to GPU providers per block using time-weighted calculus.' },
          { icon: Wifi, title: 'Edge Mesh', description: 'Latency-aware routing ensures minimal hops between requester and provider.' },
          { icon: Server, title: 'Secure Containers', description: 'ECS tasks operate in locked, encrypted enclaves to protect proprietary models.' }
        ].map((feature) => (
          <Card key={feature.title} elevated className="space-y-4">
            <feature.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="text-sm text-white/60">{feature.description}</p>
          </Card>
        ))}
      </section>

      <GpuStatsOverview stats={stats} />

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GpuRegistrationForm onRegistered={refresh} />
        <GpuNodesTable nodes={nodes} />
      </section>
    </div>
  );
}
