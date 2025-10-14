import { RevenueCalculator } from '@/components/revenue/RevenueCalculator';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/formatters';

const revenueStreams = [
  { name: 'Far Inference', share: 34, change: '+12%' },
  { name: 'Far GPU De-Pin', share: 28, change: '+8%' },
  { name: 'Farcana Game', share: 16, change: '+4%' },
  { name: 'Far DeSci', share: 9, change: '+2%' },
  { name: 'Far GameD', share: 8, change: '+1%' },
  { name: 'FarTwin AI', share: 5, change: '+11%' }
];

export default function RevenuePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold text-white">Revenue Intelligence</h1>
        <p className="max-w-2xl text-sm text-white/60">
          Monitor revenue performance across all Far Labs verticals and forecast staking yields powered by on-chain telemetry.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {revenueStreams.map((stream) => (
          <Card key={stream.name} elevated className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">{stream.change}</p>
            <p className="text-xl font-semibold text-white">{stream.name}</p>
            <p className="text-sm text-brand-soft">{stream.share}% protocol share</p>
            <p className="text-sm text-white/60">
              {formatCurrency((stream.share / 100) * 182_000_000)} annualized
            </p>
          </Card>
        ))}
      </section>

      <RevenueCalculator />
    </div>
  );
}
