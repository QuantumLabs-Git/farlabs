import { useEffect, useState, useCallback } from 'react';
import { fetchPaymentBalance, requestFaucetTokens, type PaymentBalance, type FaucetResponse } from '@/lib/api/payments';

export function usePaymentBalance(walletAddress: string | undefined) {
  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPaymentBalance(walletAddress);
      setBalance(data);
    } catch (err) {
      console.error('Failed to fetch payment balance:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const requestFaucet = useCallback(async (): Promise<FaucetResponse> => {
    if (!walletAddress) {
      throw new Error('No wallet connected');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await requestFaucetTokens(walletAddress);

      // Refresh balance after successful faucet request
      if (response.success) {
        await refreshBalance();
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request tokens';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, refreshBalance]);

  return {
    balance,
    loading,
    error,
    refreshBalance,
    requestFaucet,
    formattedBalance: balance ? `${balance.total.toFixed(2)} FAR` : '0.00 FAR'
  };
}
