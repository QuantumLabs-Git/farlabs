import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface RevenueStreamSummary {
  id: string;
  name: string;
  percentage: number;
  monthlyReturn: number;
}

export interface RevenueSummaryResponse {
  totalUsd: number;
  totalFar: number;
  streams: RevenueStreamSummary[];
}

export interface RevenueProjectionPoint {
  period: string;
  far: number;
  usd: number;
}

export interface RevenueProjectionResponse {
  points: RevenueProjectionPoint[];
}

export async function fetchRevenueSummary() {
  const { data } = await apiClient.get<RevenueSummaryResponse>(API_ENDPOINTS.revenue.summary);
  return data;
}

export async function fetchRevenueProjections() {
  const { data } = await apiClient.get<RevenueProjectionResponse>(API_ENDPOINTS.revenue.projections);
  return data.points ?? [];
}
