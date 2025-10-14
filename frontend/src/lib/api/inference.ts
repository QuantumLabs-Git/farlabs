import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface InferencePayload {
  model_id: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

export interface InferenceTask {
  task_id: string;
  user_address: string;
  model: string;
  prompt: string;
  node_id: string;
  status: string;
  max_tokens: number;
  temperature: number;
  result?: string;
  tokens_generated?: number;
  cost?: number;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface NetworkStatus {
  total_nodes: number;
  available_nodes: number;
  total_vram_gb: number;
  models_available: string[];
  average_node_score: number;
}

export async function runInference(payload: InferencePayload) {
  const { data } = await apiClient.post<{ task_id: string; result: string; tokens_used: number; cost: number; model: string }>(
    API_ENDPOINTS.inference.generate,
    payload
  );
  return data;
}

export async function fetchInferenceTasks() {
  const { data } = await apiClient.get<{ tasks: InferenceTask[] }>(API_ENDPOINTS.inference.tasks);
  return data.tasks;
}

export async function fetchInferenceTask(taskId: string) {
  const { data } = await apiClient.get<InferenceTask>(API_ENDPOINTS.inference.task(taskId));
  return data;
}

export async function fetchNetworkStatus() {
  const { data } = await apiClient.get<NetworkStatus>(API_ENDPOINTS.inference.networkStatus);
  return data;
}
