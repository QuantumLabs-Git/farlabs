"use client";

import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/utils/formatters';

const ResponsiveContainer = dynamic(() =>
  import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false }
);
const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), {
  ssr: false
});
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });

interface RevenueChartPoint {
  label: string;
  far: number;
  usd: number;
}

interface RevenueChartProps {
  data?: RevenueChartPoint[];
  isLoading?: boolean;
}

export function RevenueChart({ data = [], isLoading = false }: RevenueChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="h-72 w-full overflow-hidden rounded-3xl border border-white/10 bg-[#080808]/80 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
        Revenue Streams
      </p>
      <div className="mt-6 h-full w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                  <stop offset="75%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                  <stop offset="75%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b0b0b',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
                formatter={(value: number, name: string) =>
                  name === 'usd'
                    ? [formatCurrency(value, 'USD'), name.toUpperCase()]
                    : [`${value.toLocaleString()} FAR`, name.toUpperCase()]
                }
              />
              <Area type="monotone" dataKey="usd" stroke="#7C3AED" fill="url(#colorUsd)" strokeWidth={3} />
              <Area type="monotone" dataKey="far" stroke="#10B981" fill="url(#colorFar)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-white/5 bg-black/20 text-sm text-white/50">
            {isLoading ? 'Loading revenue data…' : 'Revenue data will appear here once available.'}
          </div>
        )}
      </div>
    </div>
  );
}
