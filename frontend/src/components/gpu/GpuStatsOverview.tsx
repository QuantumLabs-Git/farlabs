'use client';

import { GpuStats } from '@/lib/api/gpu';
import { Card } from '@/components/ui/Card';

interface Props {
  stats?: GpuStats;
}

export function GpuStatsOverview({ stats }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card elevated className="space-y-2 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-white/40">Total Nodes</p>
        <p className="text-3xl font-semibold text-white">{stats?.total_nodes ?? 0}</p>
      </Card>
      <Card elevated className="space-y-2 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-white/40">Available</p>
        <p className="text-3xl font-semibold text-white">{stats?.available_nodes ?? 0}</p>
      </Card>
      <Card elevated className="space-y-2 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-white/40">Total VRAM</p>
        <p className="text-3xl font-semibold text-white">{stats?.total_vram_gb ?? 0} GB</p>
      </Card>
    </div>
  );
}
