'use client';

import { GpuNode } from '@/lib/api/gpu';
import { Card } from '@/components/ui/Card';
import clsx from 'clsx';

interface Props {
  nodes: GpuNode[];
}

const statusStyles: Record<string, string> = {
  available: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  busy: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  offline: 'bg-rose-500/20 text-rose-200 border-rose-500/30'
};

export function GpuNodesTable({ nodes }: Props) {
  if (!nodes.length) {
    return (
      <Card elevated className="grid place-items-center py-12 text-sm text-white/60">
        No nodes registered yet. Connect a GPU to see live telemetry.
      </Card>
    );
  }

  return (
    <Card elevated className="overflow-hidden">
      <table className="w-full table-fixed text-left text-sm text-white/70">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.26em] text-white/40">
          <tr>
            <th className="px-6 py-4">Node</th>
            <th className="px-6 py-4">GPU</th>
            <th className="px-6 py-4">VRAM</th>
            <th className="px-6 py-4">Bandwidth</th>
            <th className="px-6 py-4">Score</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.node_id} className="border-t border-white/5">
              <td className="px-6 py-4 font-mono text-xs text-white/60">{node.node_id}</td>
              <td className="px-6 py-4 text-white">{node.gpu_model}</td>
              <td className="px-6 py-4">{node.vram_gb} GB</td>
              <td className="px-6 py-4">{node.bandwidth_gbps} Gbps</td>
              <td className="px-6 py-4">{node.score?.toFixed?.(1) ?? node.score}</td>
              <td className="px-6 py-4">
                <span
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    statusStyles[node.status ?? 'available'] ?? 'bg-white/10 border-white/20 text-white/70'
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {node.status ?? 'available'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
