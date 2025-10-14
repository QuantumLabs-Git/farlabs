import useSWR from 'swr';
import { fetchInferenceTasks, InferenceTask } from '@/lib/api/inference';

export function useInferenceTasks() {
  const { data, error, isLoading, mutate } = useSWR<InferenceTask[]>(
    'inference-tasks',
    fetchInferenceTasks,
    {
      refreshInterval: 20_000
    }
  );

  return {
    tasks: data ?? [],
    isLoading,
    isError: Boolean(error),
    refresh: mutate
  };
}
