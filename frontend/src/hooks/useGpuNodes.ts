import useSWR from 'swr';
import { fetchGpuNodes, fetchGpuStats, GpuNode, GpuStats } from '@/lib/api/gpu';

export function useGpuNodes() {
  const { data, error, isLoading, mutate } = useSWR<GpuNode[]>('gpu-nodes', fetchGpuNodes, {
    refreshInterval: 30_000
  });

  return {
    nodes: data ?? [],
    isLoading,
    isError: Boolean(error),
    refresh: mutate
  };
}

export function useGpuStats() {
  const { data, error, isLoading } = useSWR<GpuStats>('gpu-stats', fetchGpuStats, {
    refreshInterval: 60_000
  });

  return {
    stats: data,
    isLoading,
    isError: Boolean(error)
  };
}
