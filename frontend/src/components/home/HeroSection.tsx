"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Github } from 'lucide-react';
import { useRevenue } from '@/hooks/useRevenue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useStakingMetrics } from '@/hooks/useStaking';

export function HeroSection() {
  const { revenue } = useRevenue();
  const { status: networkStatus } = useNetworkStatus();
  const { metrics: stakingMetrics } = useStakingMetrics();

  const overviewCards = [
    {
      label: 'Revenue Streams',
      value:
        revenue && revenue.streams ? String(revenue.streams.length) : '—',
      caption: 'Tokenized product verticals'
    },
    {
      label: 'Active Nodes',
      value:
        networkStatus?.available_nodes !== undefined
          ? networkStatus.available_nodes.toLocaleString()
          : '—',
      caption: 'GPU providers across active regions'
    },
    {
      label: 'FAR Staked',
      value:
        stakingMetrics?.tvl_far !== undefined
          ? `${stakingMetrics.tvl_far.toLocaleString()} FAR`
          : '—',
      caption: 'Value secured by protocol staking'
    }
  ];

  return (
    <section className="relative">
      <div className="absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
      <div className="relative space-y-10 overflow-hidden rounded-[40px] border border-white/5 bg-[#090909]/60 p-10 md:p-16">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.25em] text-white/70 backdrop-blur-lg"
        >
          WEB3 SUPERSTRUCTURE
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="space-y-6"
        >
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Build, stake, and scale with the{' '}
            <span className="bg-gradient-to-r from-brand via-brand-soft to-brand bg-clip-text text-transparent">
              Far Labs protocol suite
            </span>
            .
          </h1>
          <p className="max-w-2xl text-lg text-white/80 md:text-xl">
            Six interoperable platforms unified by the $FAR token. Deploy AI inference, gaming,
            scientific research, and GPU liquidity with enterprise-grade security and on-chain
            economics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-4"
        >
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 rounded-full border border-brand/40 bg-brand px-8 py-3 text-sm font-semibold text-white shadow-neon transition-all duration-300 hover:-translate-y-0.5"
          >
            Launch Control <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/docs/spec"
            className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white/80 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Read Technical Spec <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="https://github.com/farlabs"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/70 transition-all duration-300 hover:border-white/30 hover:text-white"
          >
            <Github className="h-4 w-4" /> GitHub
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl md:grid-cols-3"
        >
          {overviewCards.map((item) => (
            <div key={item.label} className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">{item.label}</p>
              <p className="text-3xl font-semibold text-white">{item.value}</p>
              <p className="text-sm text-white/60">{item.caption}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
