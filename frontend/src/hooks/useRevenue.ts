import { useMemo } from 'react';
import useSWR from 'swr';
import {
  fetchRevenueSummary,
  fetchRevenueProjections,
  RevenueProjectionPoint,
  RevenueSummaryResponse
} from '@/lib/api/revenue';

export function useRevenue() {
  const { data, error, isLoading } = useSWR<RevenueSummaryResponse>('revenue-summary', fetchRevenueSummary, {
    refreshInterval: 30_000
  });

  return {
    revenue: data,
    isLoading,
    isError: Boolean(error)
  };
}

export function useRevenueProjections() {
  const { data, error, isLoading } = useSWR<RevenueProjectionPoint[]>(
    'revenue-projections',
    fetchRevenueProjections,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false
    }
  );

  const normalized = useMemo(
    () =>
      (data ?? []).map((point, index) => ({
        label: point.period ?? `Period ${index + 1}`,
        far: Number(point.far ?? 0),
        usd: Number(point.usd ?? 0)
      })),
    [data]
  );

  return {
    projections: normalized,
    isLoading,
    isError: Boolean(error)
  };
}
