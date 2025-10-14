'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Cpu,
  Network,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Server,
  GitBranch
} from 'lucide-react';

interface NodeMetrics {
  id: string;
  peer_id: string;
  status: 'online' | 'offline' | 'degraded';
  gpu_model: string;
  vram_gb: number;
  gpu_utilization: number;
  layers_served: number;
  total_requests: number;
  total_earnings_far: number;
  location: string;
  uptime_hours: number;
}

interface MeshMetrics {
  total_nodes: number;
  active_nodes: number;
  total_requests: number;
  avg_latency_ms: number;
  total_tokens_processed: number;
  network_health: number;
}

export default function MonitoringPage() {
  const [meshMetrics, setMeshMetrics] = useState<MeshMetrics>({
    total_nodes: 0,
    active_nodes: 0,
    total_requests: 0,
    avg_latency_ms: 0,
    total_tokens_processed: 0,
    network_health: 0
  });

  const [nodes, setNodes] = useState<NodeMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch mesh metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/monitoring/mesh-status');
        // const data = await response.json();

        // Mock data for demonstration
        setMeshMetrics({
          total_nodes: 24,
          active_nodes: 21,
          total_requests: 15847,
          avg_latency_ms: 187,
          total_tokens_processed: 2847293,
          network_health: 95.8
        });

        // Mock node data
        setNodes([
          {
            id: 'node-001',
            peer_id: 'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
            status: 'online',
            gpu_model: 'NVIDIA A100',
            vram_gb: 80,
            gpu_utilization: 87,
            layers_served: 12,
            total_requests: 4521,
            total_earnings_far: 124.38,
            location: 'US-East',
            uptime_hours: 168
          },
          {
            id: 'node-002',
            peer_id: 'QmXnnyufdzAWL5CqZ2RnPNtYuxW1qY7hqzgUKRkYSNqGXh',
            status: 'online',
            gpu_model: 'NVIDIA RTX 4090',
            vram_gb: 24,
            gpu_utilization: 92,
            layers_served: 6,
            total_requests: 2847,
            total_earnings_far: 78.92,
            location: 'EU-West',
            uptime_hours: 142
          },
          {
            id: 'node-003',
            peer_id: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
            status: 'degraded',
            gpu_model: 'NVIDIA V100',
            vram_gb: 32,
            gpu_utilization: 45,
            layers_served: 8,
            total_requests: 1923,
            total_earnings_far: 52.14,
            location: 'Asia-Pacific',
            uptime_hours: 96
          }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Mesh Network Monitor
              </h1>
              <p className="text-gray-400 mt-2">
                Real-time monitoring of the Far Mesh distributed inference network
              </p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Live</span>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {[
            {
              icon: Server,
              label: 'Active Nodes',
              value: `${meshMetrics.active_nodes}/${meshMetrics.total_nodes}`,
              color: 'from-blue-500 to-cyan-500',
              change: '+3 today'
            },
            {
              icon: GitBranch,
              label: 'Total Requests',
              value: meshMetrics.total_requests.toLocaleString(),
              color: 'from-purple-500 to-pink-500',
              change: '+847 today'
            },
            {
              icon: Clock,
              label: 'Avg Latency',
              value: `${meshMetrics.avg_latency_ms}ms`,
              color: 'from-green-500 to-emerald-500',
              change: '-12ms'
            },
            {
              icon: Zap,
              label: 'Tokens Processed',
              value: `${(meshMetrics.total_tokens_processed / 1000000).toFixed(1)}M`,
              color: 'from-orange-500 to-red-500',
              change: '+184K today'
            },
            {
              icon: Activity,
              label: 'Network Health',
              value: `${meshMetrics.network_health.toFixed(1)}%`,
              color: 'from-green-500 to-teal-500',
              change: '+1.2%'
            },
            {
              icon: DollarSign,
              label: 'FAR Distributed',
              value: '12.8K',
              color: 'from-yellow-500 to-amber-500',
              change: '+1.2K today'
            }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} mb-4`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-sm text-gray-400 mb-2">{metric.label}</div>
              <div className="text-xs text-green-400">{metric.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Network Topology Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Network className="w-6 h-6 text-purple-400" />
            Network Topology
          </h2>

          <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700/30 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Network className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Interactive mesh topology visualization</p>
              <p className="text-sm text-gray-500">
                Showing node connections, data flow, and layer distribution
              </p>
              <div className="mt-6 text-xs text-gray-500 bg-gray-800/50 rounded-lg p-4 max-w-md mx-auto">
                💡 This will display a real-time force-directed graph showing how nodes are connected
                in the DHT network, with visual indicators for active inference paths.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active Nodes Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden"
        >
          <div className="p-8 border-b border-gray-700/50">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-400" />
              Active Nodes ({nodes.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-semibold">Node</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">GPU</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Utilization</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Layers</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Requests</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Earnings</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Location</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Uptime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {nodes.map((node, index) => (
                  <motion.tr
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <div className="text-white font-medium">{node.id}</div>
                        <div className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                          {node.peer_id}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {node.status === 'online' && (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm">Online</span>
                          </>
                        )}
                        {node.status === 'degraded' && (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 text-sm">Degraded</span>
                          </>
                        )}
                        {node.status === 'offline' && (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 text-sm">Offline</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-white text-sm">{node.gpu_model}</div>
                        <div className="text-xs text-gray-500">{node.vram_gb}GB VRAM</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              node.gpu_utilization > 80
                                ? 'bg-green-500'
                                : node.gpu_utilization > 50
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${node.gpu_utilization}%` }}
                          />
                        </div>
                        <span className="text-white text-sm font-medium w-10">
                          {node.gpu_utilization}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-white font-mono">{node.layers_served}</td>
                    <td className="p-4 text-white">{node.total_requests.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="text-green-400 font-medium">
                        {node.total_earnings_far.toFixed(2)} FAR
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{node.location}</td>
                    <td className="p-4 text-gray-300">{node.uptime_hours}h</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Performance Charts Section */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Request Volume (24h)
            </h3>
            <div className="h-64 flex items-center justify-center border border-gray-700/30 rounded-xl bg-gray-900/50">
              <p className="text-gray-500">Chart: Requests over time</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-purple-400" />
              GPU Utilization Distribution
            </h3>
            <div className="h-64 flex items-center justify-center border border-gray-700/30 rounded-xl bg-gray-900/50">
              <p className="text-gray-500">Chart: GPU usage across nodes</p>
            </div>
          </motion.div>
        </div>

        {/* Beta Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex gap-4">
            <Activity className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Beta Monitoring Dashboard</h3>
              <p className="text-gray-300 leading-relaxed">
                This monitoring dashboard is in active development. Additional features coming soon include:
                request tracing, predictive analytics, custom alerts, historical data export, and advanced
                network topology visualization with interactive node selection.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
