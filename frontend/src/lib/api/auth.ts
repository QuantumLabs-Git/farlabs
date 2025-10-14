import { apiClient } from '@/lib/api/client';

export interface LoginResponse {
  token: string;
  wallet_address: string;
  expires_in: number;
  session_tag?: string | null;
}

export async function loginWithWallet(walletAddress: string, sessionTag?: string) {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', {
    wallet_address: walletAddress,
    session_tag: sessionTag
  });
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get<{ wallet_address: string; session_tag?: string | null }>(
    '/api/auth/me'
  );
  return data;
}
