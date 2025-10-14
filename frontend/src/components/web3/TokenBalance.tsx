"use client";

import { useWeb3 } from '@/hooks/useWeb3';
import { formatCurrency } from '@/lib/utils/formatters';
import { motion } from 'framer-motion';

interface TokenBalanceProps {
  usdPrice?: number | null;
}

export function TokenBalance({ usdPrice }: TokenBalanceProps) {
  const { formattedBalance, balanceLoading } = useWeb3();
  const parsedBalance = Number.parseFloat(formattedBalance.replace(/,/g, ''));
  const numericBalance = Number.isFinite(parsedBalance) ? parsedBalance : 0;
  const hasPrice = usdPrice !== undefined && usdPrice !== null;
  const usdValue = hasPrice ? formatCurrency(numericBalance * usdPrice) : null;
  const priceLabel = hasPrice ? formatCurrency(usdPrice) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      className="rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl"
    >
      <p className="text-xs uppercase tracking-[0.26em] text-white/40">Your $FAR Balance</p>
      <div className="mt-4 flex items-baseline gap-3">
        <p className="text-3xl font-semibold text-white">
          {balanceLoading ? '—' : `${formattedBalance} $FAR`}
        </p>
        <span className="rounded-full border border-brand/30 px-3 py-1 text-xs text-brand-soft">
          {balanceLoading ? '•' : usdValue ?? '—'}
        </span>
      </div>
      <p className="mt-3 text-sm text-white/60">
        Current spot price: {priceLabel ?? '—'} • Linked to Binance Smart Chain mainnet.
      </p>
    </motion.div>
  );
}
