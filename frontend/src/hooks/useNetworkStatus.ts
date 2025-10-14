import useSWR from 'swr';
import { fetchNetworkStatus, NetworkStatus } from '@/lib/api/inference';

export function useNetworkStatus() {
  const { data, error, isLoading } = useSWR<NetworkStatus>('network-status', fetchNetworkStatus, {
    refreshInterval: 60_000
  });

  return {
    status: data,
    isLoading,
    isError: Boolean(error)
  };
}
