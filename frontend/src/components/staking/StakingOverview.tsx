'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWeb3 } from '@/hooks/useWeb3';
import { useStakingPosition } from '@/hooks/useStaking';
import { stakeFar, unstakeFar } from '@/lib/api/staking';

export function StakingOverview() {
  const { address } = useWeb3();
  const { position, refresh } = useStakingPosition();
  const [amount, setAmount] = useState(1000);
  const [lockPeriod, setLockPeriod] = useState(180);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStake = async () => {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      await stakeFar(address, amount, lockPeriod);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to stake');
    } finally {
      setBusy(false);
    }
  };

  const handleUnstake = async () => {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      await unstakeFar(address, amount);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unstake');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card elevated className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">Staked Balance</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {position ? position.amount.toLocaleString() : '—'} FAR
          </p>
          <p className="text-xs text-white/40">
            Lock Period: {position?.lock_period_days ?? 0} days
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-white/70">
          <span>Amount ($FAR)</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
          />
        </label>
        <label className="space-y-2 text-sm text-white/70">
          <span>Lock Period (days)</span>
          <input
            type="number"
            min={30}
            max={1460}
            value={lockPeriod}
            onChange={(event) => setLockPeriod(Number(event.target.value))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
          />
        </label>
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button size="sm" className="flex-1" onClick={handleStake} disabled={busy || !address}>
          Stake
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1"
          onClick={handleUnstake}
          disabled={busy || !address}
        >
          Unstake
        </Button>
      </div>
    </Card>
  );
}
