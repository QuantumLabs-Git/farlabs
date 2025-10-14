"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Cpu, Gauge, Shield, Sparkles, SquareStack, TrendingUp } from 'lucide-react';
import { useGpuStats } from '@/hooks/useGpuNodes';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useStakingMetrics } from '@/hooks/useStaking';
import { useRevenue } from '@/hooks/useRevenue';

interface StatDefinition {
  icon: LucideIcon;
  title: string;
  value: string;
  badge: string;
  description: string;
}

export function StatsSection() {
  const { stats: gpuStats, isLoading: gpuLoading } = useGpuStats();
  const { status: networkStatus, isLoading: networkLoading } = useNetworkStatus();
  const { metrics: stakingMetrics, isLoading: stakingLoading } = useStakingMetrics();
  const { revenue, isLoading: revenueLoading } = useRevenue();

  const stats: StatDefinition[] = useMemo(() => {
    const loadingBadge = 'Awaiting data';
    return [
      {
        icon: Cpu,
        title: 'GPU Nodes',
        value: gpuStats?.total_nodes !== undefined ? gpuStats.total_nodes.toLocaleString() : '—',
        badge:
          gpuStats?.available_nodes !== undefined
            ? `${gpuStats.available_nodes.toLocaleString()} available`
            : loadingBadge,
        description: 'Registered GPU providers participating in Far Inference workloads.'
      },
      {
        icon: Gauge,
        title: 'Average Node Score',
        value:
          networkStatus?.average_node_score !== undefined
            ? networkStatus.average_node_score.toFixed(1)
            : '—',
        badge: networkStatus ? 'Live telemetry' : loadingBadge,
        description: 'Performance-weighted reliability score across active nodes.'
      },
      {
        icon: TrendingUp,
        title: 'Staker APY',
        value:
          stakingMetrics?.apy !== undefined
            ? `${(stakingMetrics.apy * 100).toFixed(2)}%`
            : '—',
        badge: stakingMetrics ? 'Dynamic' : loadingBadge,
        description: '$FAR staking yield linked to protocol revenue distribution.'
      },
      {
        icon: Shield,
        title: 'Participants',
        value:
          stakingMetrics?.participants !== undefined
            ? stakingMetrics.participants.toLocaleString()
            : '—',
        badge:
          stakingMetrics?.average_lock_days !== undefined
            ? `${stakingMetrics.average_lock_days.toLocaleString()} day avg lock`
            : loadingBadge,
        description: 'Unique wallets currently securing protocol staking contracts.'
      },
      {
        icon: SquareStack,
        title: 'Revenue Streams',
        value: revenue?.streams ? revenue.streams.length.toString() : '—',
        badge:
          revenue?.totalFar !== undefined
            ? `${revenue.totalFar.toLocaleString()} FAR total`
            : loadingBadge,
        description: 'Active product verticals contributing to protocol income.'
      },
      {
        icon: Sparkles,
        title: 'Total Treasury (USD)',
        value:
          revenue?.totalUsd !== undefined
            ? new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              }).format(revenue.totalUsd)
            : '—',
        badge: revenue ? 'Rolling sum' : loadingBadge,
        description: 'Aggregate USD value of revenue processed through Far Labs services.'
      }
    ];
  }, [gpuStats, networkStatus, stakingMetrics, revenue]);

  const anyLoading = gpuLoading || networkLoading || stakingLoading || revenueLoading;
  const hasLiveData = stats.some((entry) => entry.value !== '—');
  const headerBadge = anyLoading && !hasLiveData ? 'AWAITING DATA' : 'LIVE METRICS';

  return (
    <section className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        className="flex items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">Live protocol telemetry</h2>
          <p className="text-sm text-white/60 md:text-base">
            Realtime metrics streaming from the analytics pipeline and consensus contracts.
          </p>
        </div>
        <span className="hidden rounded-full border border-brand/40 px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-brand-soft md:inline-flex">
          {headerBadge}
        </span>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all duration-300 hover:border-brand/40 hover:bg-white/[0.05]"
          >
            <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-brand-soft/30 blur-xl" />
            </div>

            <stat.icon className="h-5 w-5 text-brand-soft transition-transform duration-300 group-hover:scale-110" />
            <div className="mt-4 flex items-end gap-3">
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <span className="rounded-full border border-brand/20 px-2 py-1 text-xs font-semibold text-brand-soft">
                {stat.badge}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.24em] text-white/70">
              {stat.title}
            </p>
            <p className="mt-3 text-sm text-white/60">{stat.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
