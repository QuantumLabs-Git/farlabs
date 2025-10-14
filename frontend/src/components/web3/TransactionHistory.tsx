"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, ArrowUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useActivity } from '@/hooks/useActivity';

const typeMeta: Record<
  string,
  { label: string; icon: LucideIcon; tone: string; direction?: 'credit' | 'debit' }
> = {
  inference: { label: 'Inference Task', icon: ArrowDown, tone: 'text-cyan-400', direction: 'debit' },
  topup: { label: 'Wallet Top-up', icon: ArrowDown, tone: 'text-emerald-300', direction: 'credit' },
  withdraw: {
    label: 'Wallet Withdrawal',
    icon: ArrowUpRight,
    tone: 'text-orange-300',
    direction: 'debit'
  },
  lock: { label: 'Escrow Lock', icon: ArrowDown, tone: 'text-amber-300', direction: 'debit' },
  lock_escrow: {
    label: 'Escrow Credit',
    icon: ArrowDown,
    tone: 'text-amber-300',
    direction: 'credit'
  },
  inference_hold: {
    label: 'Inference Hold',
    icon: ArrowDown,
    tone: 'text-amber-300',
    direction: 'debit'
  },
  inference_charge: {
    label: 'Inference Charge',
    icon: ArrowUp,
    tone: 'text-rose-300',
    direction: 'debit'
  },
  inference_refund: {
    label: 'Inference Refund',
    icon: ArrowDown,
    tone: 'text-emerald-300',
    direction: 'credit'
  },
  release: {
    label: 'Escrow Release',
    icon: ArrowDown,
    tone: 'text-emerald-300',
    direction: 'credit'
  },
  payout: { label: 'Payout', icon: ArrowDown, tone: 'text-emerald-300', direction: 'credit' },
  gpu_payout: {
    label: 'GPU Payout',
    icon: ArrowDown,
    tone: 'text-emerald-300',
    direction: 'credit'
  },
  staking_share: {
    label: 'Staker Share',
    icon: ArrowDown,
    tone: 'text-indigo-300',
    direction: 'credit'
  },
  treasury_share: {
    label: 'Treasury Share',
    icon: ArrowDown,
    tone: 'text-purple-300',
    direction: 'credit'
  }
};

export function TransactionHistory() {
  const { activity } = useActivity();

  const transactions = useMemo(
    () =>
      activity.map((txn) => {
        const meta = typeMeta[txn.type] ?? {
          label: txn.type,
          icon: ArrowDown,
          tone: 'text-white/60',
          direction: txn.direction ?? 'debit'
        };
        return { ...txn, meta };
      }),
    [activity]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      className="rounded-3xl border border-white/5 bg-[#090909]/80 p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
          Activity
        </p>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
          {transactions.length} entries
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {transactions.map((txn) => {
          const { meta } = txn as typeof txn & { meta: typeof typeMeta[string] };
          const Icon = meta.icon;
          const amountValue =
            typeof txn.amount === 'number' ? txn.amount : Number(txn.amount ?? 0);
          return (
            <div
              key={txn.id}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/70 transition-all duration-300 hover:border-brand/40 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-full bg-white/5 p-2 ${meta.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-white">{meta.label}</p>
                  {txn.timestamp && (
                    <p className="text-xs text-white/40">{new Date(txn.timestamp).toLocaleString()}</p>
                  )}
                  {txn.model && <p className="text-xs text-white/40">Model: {txn.model}</p>}
                  {txn.metadata?.reference && (
                    <p className="text-xs text-white/40">Ref: {String(txn.metadata.reference)}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">
                  {amountValue.toLocaleString()} {txn.asset}
                </p>
                <p className="text-xs text-white/40 capitalize">
                  {meta.direction ?? txn.direction ?? 'debit'} • {txn.status}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
