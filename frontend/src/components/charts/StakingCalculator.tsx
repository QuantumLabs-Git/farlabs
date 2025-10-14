"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

export function StakingCalculator() {
  const [amount, setAmount] = useState(5000);
  const [duration, setDuration] = useState(12);
  const [apy, setApy] = useState(0.185);

  const projectedRewards = amount * apy * (duration / 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      className="rounded-3xl border border-white/5 bg-[#090909]/80 p-6"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
          Staking Simulator
        </p>
        <span className="rounded-full border border-brand/30 px-3 py-1 text-xs text-brand-soft">
          {formatPercent(apy)} APY
        </span>
      </div>
      <div className="mt-6 space-y-6">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-white/40">
            Stake Amount ($FAR)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-semibold text-white focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-white/40">
            Lock Duration ({duration} months)
          </label>
          <input
            type="range"
            min="1"
            max="36"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="mt-3 w-full accent-brand"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-white/40">
            APY
          </label>
          <input
            type="range"
            min="0.05"
            max="0.35"
            step="0.005"
            value={apy}
            onChange={(event) => setApy(Number(event.target.value))}
            className="mt-3 w-full accent-brand-soft"
          />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Projected Rewards</p>
          <p className="mt-3 text-3xl font-semibold text-brand-soft">
            {formatCurrency(projectedRewards, 'USD')}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {amount.toLocaleString()} $FAR locked yields{' '}
            {(projectedRewards / amount).toLocaleString(undefined, {
              style: 'percent',
              minimumFractionDigits: 2
            })}{' '}
            over {duration} months assuming APY remains constant.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
