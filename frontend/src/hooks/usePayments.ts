import useSWR from 'swr';
import { fetchPaymentBalance, fetchPaymentHistory, PaymentBalance, PaymentHistoryRecord } from '@/lib/api/payments';
import { useWeb3 } from '@/hooks/useWeb3';

export function usePaymentBalance() {
  const { address } = useWeb3();
  const { data, error, isLoading, mutate } = useSWR<PaymentBalance>(
    address ? ['payment-balance', address] : null,
    () => fetchPaymentBalance(address!)
  );

  return {
    balance: data,
    isLoading,
    isError: Boolean(error),
    refresh: mutate
  };
}

export function usePaymentHistory(limit = 25) {
  const { address } = useWeb3();
  const { data, error, isLoading, mutate } = useSWR<PaymentHistoryRecord[]>(
    address ? ['payment-history', address, limit] : null,
    () => fetchPaymentHistory(address!)
  );

  return {
    history: data ?? [],
    isLoading,
    isError: Boolean(error),
    refresh: mutate
  };
}
