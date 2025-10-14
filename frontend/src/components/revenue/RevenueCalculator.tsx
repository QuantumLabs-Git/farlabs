'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

const ResponsiveContainer = dynamic(() =>
  import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false }
);
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), {
  ssr: false
});
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });

interface RevenueStream {
  id: string;
  name: string;
  enabled: boolean;
  monthlyBase: number;
  growthRate: number;
}

export function RevenueCalculator() {
  const [stakingAmount, setStakingAmount] = useState(10_000);
  const [stakingPeriod, setStakingPeriod] = useState(12);
  const [streams, setStreams] = useState<RevenueStream[]>([
    {
      id: 'inference',
      name: 'Far Inference',
      enabled: true,
      monthlyBase: 0.08,
      growthRate: 1.05
    },
    {
      id: 'gpu',
      name: 'Far GPU De-Pin',
      enabled: true,
      monthlyBase: 0.06,
      growthRate: 1.15
    },
    {
      id: 'gaming',
      name: 'Farcana Game',
      enabled: false,
      monthlyBase: 0.04,
      growthRate: 1.03
    },
    {
      id: 'desci',
      name: 'Far DeSci',
      enabled: false,
      monthlyBase: 0.02,
      growthRate: 1.02
    },
    {
      id: 'gamed',
      name: 'Far GameD',
      enabled: false,
      monthlyBase: 0.03,
      growthRate: 1.04
    },
    {
      id: 'fartwin',
      name: 'FarTwin AI',
      enabled: false,
      monthlyBase: 0.05,
      growthRate: 1.08
    }
  ]);

  const projection = useMemo(() => {
    const data = [];
    let cumulative = 0;

    for (let month = 0; month <= 36; month += 1) {
      let monthlyRevenue = 0;

      streams.forEach((stream) => {
        if (!stream.enabled) return;

        const base = stakingAmount * stream.monthlyBase;
        const growth = Math.pow(stream.growthRate, month);
        monthlyRevenue += base * growth;
      });

      cumulative += monthlyRevenue;
      data.push({
        month,
        monthly: monthlyRevenue,
        cumulative,
        roi: cumulative / stakingAmount
      });
    }

    return data;
  }, [stakingAmount, streams]);

  const toggleStream = (id: string) => {
    setStreams((prev) =>
      prev.map((stream) => (stream.id === id ? { ...stream, enabled: !stream.enabled } : stream))
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            Revenue Forecast Calculator
          </h2>
          <p className="max-w-xl text-sm text-white/60">
            Model combined yield from all Far Labs revenue streams and identify optimal staking
            strategies powered by protocol tokenomics.
          </p>
        </div>
        <span className="inline-flex h-fit items-center rounded-full border border-brand/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-soft">
          SIMULATION ENGINE
        </span>
      </header>

      <Card className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            STREAM SELECTION
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {streams.map((stream) => (
              <button
                key={stream.id}
                type="button"
                onClick={() => toggleStream(stream.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                  stream.enabled
                    ? 'border-brand/50 bg-brand/10 text-white shadow-neon'
                    : 'border-white/10 bg-white/5 text-white/50 hover:text-white/80'
                }`}
              >
                <p className="text-sm font-semibold">{stream.name}</p>
                <p className="text-xs text-white/40">
                  Base {formatPercent(stream.monthlyBase)} • Growth x{stream.growthRate.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Staking Amount ($FAR)
            </label>
            <input
              type="number"
              value={stakingAmount}
              onChange={(event) => setStakingAmount(Number(event.target.value))}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-semibold text-white focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Staking Period ({stakingPeriod} months)
            </label>
            <input
              type="range"
              min="1"
              max="36"
              value={stakingPeriod}
              onChange={(event) => setStakingPeriod(Number(event.target.value))}
              className="mt-4 w-full accent-brand"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">Total Investment</p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {stakingAmount.toLocaleString()} $FAR
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Projected Return ({stakingPeriod} mo)
            </p>
            <p className="mt-3 text-2xl font-semibold text-brand-soft">
              {projection[stakingPeriod]?.cumulative
                ? formatCurrency(projection[stakingPeriod].cumulative)
                : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">ROI</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-400">
              {projection[stakingPeriod]?.roi
                ? formatPercent(projection[stakingPeriod].roi)
                : '—'}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#080808]/80 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
            Revenue Projection (36 months)
          </h3>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 5" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" />
                <YAxis stroke="rgba(255,255,255,0.4)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0b0b',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                  formatter={(value: number, name) => {
                    if (name === 'roi') return [formatPercent(value), 'ROI'];
                    if (name === 'monthly') return [formatCurrency(value), 'Monthly'];
                    return [formatCurrency(value), 'Cumulative'];
                  }}
                />
                <Line type="monotone" dataKey="monthly" stroke="#7C3AED" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </section>
  );
}
