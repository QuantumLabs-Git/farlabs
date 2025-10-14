export const API_ENDPOINTS = {
  auth: {
    me: '/api/auth/me'
  },
  revenue: {
    summary: '/api/revenue/summary',
    projections: '/api/revenue/projections'
  },
  inference: {
    generate: '/api/inference/generate',
    tasks: '/api/inference/tasks',
    task: (taskId: string) => `/api/inference/tasks/${taskId}`,
    networkStatus: '/api/network/status'
  },
  gpu: {
    nodes: '/api/gpu/nodes',
    node: (nodeId: string) => `/api/gpu/nodes/${nodeId}`,
    stats: '/api/gpu/stats',
    ownerNodes: (walletAddress: string) => `/api/gpu/nodes/owner/${walletAddress}`,
    legacyRegister: '/api/node/register'
  },
  staking: {
    metrics: '/api/staking/metrics'
  }
} as const;
