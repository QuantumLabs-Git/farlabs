import { apiClient } from '@/lib/api/client';

export interface ActivityRecord {
  id: string;
  type: string;
  amount: number;
  asset: string;
  status: string;
  model?: string;
  tokens?: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  direction?: 'credit' | 'debit';
}

export async function fetchInferenceActivity() {
  const { data } = await apiClient.get<{ transactions: ActivityRecord[] }>('/api/inference/activity');
  return data.transactions;
}
