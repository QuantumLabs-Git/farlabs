import useSWR from 'swr';
import { useWeb3 } from '@/hooks/useWeb3';
import {
  fetchStakingPosition,
  fetchStakingHistory,
  fetchStakingMetrics,
  StakingPosition,
  StakingHistoryEntry
} from '@/lib/api/staking';

export function useStakingPosition() {
  const { address } = useWeb3();
  const { data, error, isLoading, mutate } = useSWR<StakingPosition>(
    address ? ['staking-position', address] : null,
    () => fetchStakingPosition(address!)
  );

  return {
    position: data,
    isLoading,
    isError: Boolean(error),
    refresh: mutate
  };
}

export function useStakingHistory(limit = 25) {
  const { address } = useWeb3();
  const { data, error, isLoading, mutate } = useSWR<StakingHistoryEntry[]>(
    address ? ['staking-history', address, limit] : null,
    () => fetchStakingHistory(address!)
  );

  return {
    history: data ?? [],
    isLoading,
    isError: Boolean(error),
    refresh: mutate
  };
}

export function useStakingMetrics() {
  const { data, error, isLoading, mutate } = useSWR('staking-metrics', fetchStakingMetrics, {
    refreshInterval: 60_000
  });

  return {
    metrics: data,
    isLoading,
    isError: Boolean(error),
    refresh: mutate
  };
}
