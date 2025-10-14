import { apiClient } from '@/lib/api/client';

export interface RegisterGpuNodeInput {
  wallet_address: string;
  gpu_model: string;
  vram_gb: number;
  bandwidth_gbps: number;
  location?: string | null;
  notes?: string | null;
}

export interface GpuNode {
  node_id: string;
  wallet_address: string;
  gpu_model: string;
  vram_gb: number;
  bandwidth_gbps: number;
  status: string;
  score: number;
  tasks_completed: number;
  uptime_seconds: number;
  supported_models?: string[];
  registered_at?: string;
  last_heartbeat?: string;
  [key: string]: unknown;
}

export interface GpuStats {
  total_nodes: number;
  available_nodes: number;
  total_vram_gb: number;
  average_vram_gb: number;
}

export async function registerGpuNode(payload: RegisterGpuNodeInput) {
  const { data } = await apiClient.post<{ node_id: string; record: GpuNode }>(
    '/api/gpu/nodes',
    payload
  );
  return data;
}

export async function fetchGpuNodes() {
  const { data } = await apiClient.get<{ nodes: GpuNode[] }>('/api/gpu/nodes');
  return data.nodes;
}

export async function fetchGpuStats() {
  const { data } = await apiClient.get<GpuStats>('/api/gpu/stats');
  return data;
}

export async function fetchOwnerNodes(walletAddress: string) {
  const { data } = await apiClient.get<{ nodes: GpuNode[] }>(
    `/api/gpu/nodes/owner/${walletAddress}`
  );
  return data.nodes;
}
