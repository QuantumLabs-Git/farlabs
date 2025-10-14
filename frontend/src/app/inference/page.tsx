"use client";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RevenueCalculator } from '@/components/revenue/RevenueCalculator';
import { ArchitectureOverview } from '@/app/inference/components/ArchitectureOverview';
import { ModelCatalog } from '@/app/inference/components/ModelCatalog';
import { PricingStrategy } from '@/app/inference/components/PricingStrategy';
import { ExperienceShowcase } from '@/app/inference/components/ExperienceShowcase';
import { ReliabilitySection } from '@/app/inference/components/ReliabilitySection';
import Link from 'next/link';
import { Cpu, Layers, Network, Settings, Sparkles } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const features = [
  {
    icon: Cpu,
    title: 'Distributed GPU mesh',
    description:
      'Latency-aware routing across 12k+ GPU providers coordinated by the Far Labs distributed scheduler.'
  },
  {
    icon: Sparkles,
    title: 'Payment-aware inference',
    description:
      'Smart contract escrow, reliability scoring, and settlement (60/20/20) executed on Binance Smart Chain.'
  },
  {
    icon: Settings,
    title: 'Advanced controls',
    description:
      'Model picker, context window selector, quantization mode, batching options, and cost estimator in one panel.'
  },
  {
    icon: Network,
    title: 'Realtime telemetry',
    description:
      'Socket.io WebSocket stream for token generation, GPU node health, and oracle-fed reliability updates.'
  },
  {
    icon: Layers,
    title: 'Model registry',
    description:
      'Curated library spanning Llama 3.1, Mixtral, Gemma, DeepSeek, Qwen, and community-voted additions.'
  }
];

const distributedModes = [
  {
    title: 'Edge Micro-Shards',
    subtitle: 'Latency-sensitive, pay-as-you-go',
    description:
      'Sub-100 token shards residing on regional edge nodes. Ideal for chat interfaces and realtime copilots needing instant responses.',
    metrics: ['≤120ms p95 latency', '8M context window', 'Auto burst scaling']
  },
  {
    title: 'Validator Pods',
    subtitle: 'Balanced throughput and cost',
    description:
      'Dedicated pod of 8 GPU providers coordinated via our distributed scheduler. Optimized for steady workloads and streamed completions.',
    metrics: ['50K tokens/sec shared', 'Priority routing', 'Dynamic rate limits']
  },
  {
    title: 'Enterprise Capsules',
    subtitle: 'Reserved, compliant compute',
    description:
      'Isolated capsule with compliance guardrails, deterministic performance, and SOC2-ready logging for regulated workloads.',
    metrics: ['Single-tenant GPUs', 'Audit trail exports', 'Custom SLAs available']
  }
];

export default function InferencePage() {
  const { status } = useNetworkStatus();

  return (
    <div className="space-y-16">
      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-white">
            Far Inference Network
          </h1>
          <p className="text-sm text-white/60">
            Run high-throughput AI inference across a federated GPU mesh with on-chain settlement.
            Integrate via REST, WebSocket, or gRPC and pay only for the tokens you consume.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/inference/playground">
              <Button>Launch Playground</Button>
            </Link>
            <Link href="/docs/inference">
              <Button variant="ghost">View API Reference</Button>
            </Link>
          </div>
        </div>
        <Card elevated className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">LIVE STATUS</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-sm text-white/50">Active Nodes</p>
              <p className="text-2xl font-semibold text-white">{status?.available_nodes ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/50">Total Nodes</p>
              <p className="text-2xl font-semibold text-brand-soft">{status?.total_nodes ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/50">Total VRAM</p>
              <p className="text-2xl font-semibold text-white">{status ? `${status.total_vram_gb} GB` : '—'}</p>
            </div>
          </div>
          <p className="text-xs text-white/40">Telemetry updates once network data is available.</p>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} elevated className="space-y-4">
            <feature.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="text-sm text-white/60">{feature.description}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Inference Services
          </p>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            Choose your inference architecture
          </h2>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card elevated className="flex h-full flex-col justify-between gap-6 border-2 border-brand/30">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Cpu className="h-8 w-8 text-brand-soft" />
                <div>
                  <p className="text-2xl font-semibold text-white">Far Mono</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-soft">
                    Single-Node Inference
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/60">
                Fast, reliable inference on dedicated single GPU nodes. Perfect for production workloads requiring consistent performance and simple deployment.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-soft" />
                <span>Single GPU per request</span>
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-soft" />
                <span>Predictable latency</span>
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-soft" />
                <span>Standard API integration</span>
              </li>
            </ul>
          </Card>

          <Card elevated className="flex h-full flex-col justify-between gap-6 border-2 border-purple-500/30">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Network className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-semibold text-white">Far Mesh</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-purple-400">
                    Distributed Inference
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/60">
                Distributed inference across multiple GPU providers. Ideal for large models and cost-efficient scaling across the network mesh.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span>Multi-GPU mesh coordination</span>
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span>Cost-efficient distributed compute</span>
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span>Powered by distributed inference</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              Far Mesh Modes
            </p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Configure distributed inference pods tailored to workload shape.
            </h2>
          </div>
          <span className="inline-flex h-fit rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-purple-400">
            MESH TOPOLOGY
          </span>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {distributedModes.map((mode) => (
            <Card key={mode.title} elevated className="flex h-full flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white">{mode.title}</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-soft">
                    {mode.subtitle}
                  </p>
                </div>
                <p className="text-sm text-white/60">{mode.description}</p>
              </div>
              <ul className="space-y-2 text-sm text-white/70">
                {mode.metrics.map((metric) => (
                  <li
                    key={metric}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-soft" />
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <ArchitectureOverview />

      <ModelCatalog />

      <PricingStrategy />

      <ExperienceShowcase />

      <ReliabilitySection />

      <RevenueCalculator />
    </div>
  );
}
