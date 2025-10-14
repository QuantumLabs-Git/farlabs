import useSWR from 'swr';
import { useMemo } from 'react';
import { fetchInferenceActivity, ActivityRecord } from '@/lib/api/activity';
import { fetchPaymentHistory, PaymentHistoryRecord } from '@/lib/api/payments';
import { useWeb3 } from '@/hooks/useWeb3';

type CombinedActivity = ActivityRecord & {
  metadata?: Record<string, unknown>;
  direction?: 'credit' | 'debit';
};

export function useActivity(limit = 50) {
  const { address } = useWeb3();

  const {
    data: inference,
    error: inferenceError,
    isLoading: inferenceLoading,
    mutate: refreshInference
  } = useSWR<ActivityRecord[]>(
    'inference-activity',
    fetchInferenceActivity,
    { refreshInterval: 20_000 }
  );

  const {
    data: payments,
    error: paymentsError,
    isLoading: paymentsLoading,
    mutate: refreshPayments
  } = useSWR<PaymentHistoryRecord[]>(
    address ? ['payment-history', address, limit] : null,
    () => fetchPaymentHistory(address!)
  );

  const combined = useMemo<CombinedActivity[]>(() => {
    const entries: CombinedActivity[] = [];
    if (payments) {
      payments.forEach((record) => {
        entries.push({
          id: record.id,
          type: (record.type as ActivityRecord['type']) ?? 'inference',
          amount: record.amount,
          asset: record.asset,
          status: record.status,
          timestamp: record.timestamp,
          metadata: record.metadata,
          direction: record.direction
        });
      });
    }
    if (inference) {
      entries.push(...inference);
    }
    entries.sort((a, b) => {
      const tsA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tsB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tsB - tsA;
    });
    return entries.slice(0, limit);
  }, [payments, inference, limit]);

  return {
    activity: combined,
    isLoading: inferenceLoading || paymentsLoading,
    isError: Boolean(inferenceError || paymentsError),
    refresh: async () => {
      await Promise.all([refreshInference(), refreshPayments()]);
    }
  };
}
