import { apiClient } from '@/lib/api/client';

export interface StakingPosition {
  wallet_address: string;
  amount: number;
  lock_period_days: number;
  rewards_earned: number;
  last_updated?: string;
  since?: string;
}

export interface StakingHistoryEntry {
  id: string;
  type: string;
  amount: number;
  status: string;
  timestamp: string;
  [key: string]: unknown;
}

export async function fetchStakingPosition(walletAddress: string) {
  const { data } = await apiClient.get<StakingPosition>(
    `/api/staking/position/${walletAddress}`
  );
  return data;
}

export async function fetchStakingHistory(walletAddress: string) {
  const { data } = await apiClient.get<{ history: StakingHistoryEntry[] }>(
    `/api/staking/history/${walletAddress}`
  );
  return data.history;
}

export async function stakeFar(walletAddress: string, amount: number, lockPeriodDays: number) {
  const { data } = await apiClient.post<StakingPosition>('/api/staking/deposit', {
    wallet_address: walletAddress,
    amount,
    lock_period_days: lockPeriodDays
  });
  return data;
}

export async function unstakeFar(walletAddress: string, amount: number) {
  const { data } = await apiClient.post<StakingPosition>('/api/staking/withdraw', {
    wallet_address: walletAddress,
    amount
  });
  return data;
}

export async function fetchStakingMetrics() {
  const { data } = await apiClient.get<{
    tvl_far: number;
    apy: number;
    participants: number;
    average_lock_days: number;
    distribution: Record<string, number>;
  }>('/api/staking/metrics');
  return data;
}
