import { apiClient } from '@/lib/api/client';

export interface PaymentBalance {
  available: number;
  escrowed: number;
  total: number;
}

export interface PaymentHistoryRecord {
  id: string;
  type: string;
  direction: 'credit' | 'debit';
  amount: number;
  asset: string;
  reference?: string;
  status: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function fetchPaymentBalance(walletAddress: string) {
  const { data } = await apiClient.get<PaymentBalance>(`/api/payments/balances/${walletAddress}`);
  return data;
}

export async function fetchPaymentHistory(walletAddress: string) {
  const { data } = await apiClient.get<{ history: PaymentHistoryRecord[] }>(
    `/api/payments/history/${walletAddress}`
  );
  return data.history;
}

export async function topupPayments(amount: number, walletAddress: string, reference?: string) {
  const { data } = await apiClient.post<PaymentBalance>('/api/payments/topup', {
    wallet_address: walletAddress,
    amount,
    reference
  });
  return data;
}

export async function withdrawPayments(amount: number, walletAddress: string, reference?: string) {
  const { data } = await apiClient.post<PaymentBalance>('/api/payments/withdraw', {
    wallet_address: walletAddress,
    amount,
    reference
  });
  return data;
}

export interface FaucetResponse {
  success: boolean;
  message: string;
  amount_added?: number;
  new_balance?: PaymentBalance;
  current_balance?: PaymentBalance;
}

export async function requestFaucetTokens(walletAddress: string) {
  const { data} = await apiClient.post<FaucetResponse>('/api/payments/faucet', {
    wallet_address: walletAddress
  });
  return data;
}
