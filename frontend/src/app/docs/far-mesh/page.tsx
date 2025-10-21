'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Network, ArrowLeft, Zap, Shield, Layers, Code, CheckCircle, AlertCircle, Copy, Check, GitBranch } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function FarMeshDocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const codeExamples = {
    python: `import requests
import json

# Far Mesh Distributed Inference API
API_URL = "https://api.farlabs.ai/v1/inference"
API_KEY = "your_api_key_here"

# Submit distributed inference request
def run_mesh_inference(prompt: str, model: str = "llama-3-70b"):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "prompt": prompt,
        "max_tokens": 2048,
        "temperature": 0.7,
        "mesh_config": {
            "min_nodes": 2,
            "max_nodes": 10,
            "chunk_size": 256,
            "redundancy": 2
        }
    }

    # Submit request
    response = requests.post(
        f"{API_URL}/mesh/infer",
        headers=headers,
        json=payload
    )

    result = response.json()
    request_id = result["request_id"]

    # Poll for completion
    while True:
        status_response = requests.get(
            f"{API_URL}/mesh/status/{request_id}",
            headers=headers
        )
        status = status_response.json()

        if status["state"] == "completed":
            return status
        elif status["state"] == "failed":
            raise Exception(f"Inference failed: {status['error']}")

        time.sleep(0.5)  # Poll every 500ms

# Example usage
result = run_mesh_inference("Write a detailed analysis of neural networks")
print(result["output"])
print(f"Processed by {result['nodes_used']} nodes")
print(f"Cost: {result['cost_far']} $FAR")`,

    curl: `# Submit distributed inference request to Far Mesh
curl -X POST https://api.farlabs.ai/v1/inference/mesh/infer \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3-70b",
    "prompt": "Write a detailed analysis of neural networks",
    "max_tokens": 2048,
    "temperature": 0.7,
    "mesh_config": {
      "min_nodes": 2,
      "max_nodes": 10,
      "chunk_size": 256,
      "redundancy": 2
    }
  }'

# Response (initial):
{
  "request_id": "mesh_xyz789",
  "state": "pending",
  "submitted_at": "2025-10-11T14:30:00Z"
}

# Check status:
curl https://api.farlabs.ai/v1/inference/mesh/status/mesh_xyz789 \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response (completed):
{
  "request_id": "mesh_xyz789",
  "state": "completed",
  "output": "Neural networks are...",
  "nodes_used": 5,
  "chunks_processed": 8,
  "usage": {
    "total_tokens": 2048
  },
  "cost_far": "0.2048",
  "latency_ms": 234,
  "completed_at": "2025-10-11T14:30:02Z"
}`,

    nodejs: `import axios from 'axios';

const API_URL = 'https://api.farlabs.ai/v1/inference';
const API_KEY = process.env.FAR_API_KEY;

// Far Mesh Distributed Inference Client
class FarMeshClient {
  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      }
    });
  }

  async infer(params: {
    model: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    meshConfig?: {
      minNodes?: number;
      maxNodes?: number;
      chunkSize?: number;
      redundancy?: number;
    };
  }): Promise<any> {
    // Submit request
    const submitResponse = await this.client.post('/mesh/infer', {
      model: params.model,
      prompt: params.prompt,
      max_tokens: params.maxTokens || 2048,
      temperature: params.temperature || 0.7,
      mesh_config: params.meshConfig || {
        min_nodes: 2,
        max_nodes: 10,
        chunk_size: 256,
        redundancy: 2
      }
    });

    const requestId = submitResponse.data.request_id;

    // Poll for completion
    return this.pollStatus(requestId);
  }

  private async pollStatus(requestId: string): Promise<any> {
    while (true) {
      const statusResponse = await this.client.get(\`/mesh/status/\${requestId}\`);
      const status = statusResponse.data;

      if (status.state === 'completed') {
        return status;
      } else if (status.state === 'failed') {
        throw new Error(\`Inference failed: \${status.error}\`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Usage
const client = new FarMeshClient(API_KEY);
const result = await client.infer({
  model: 'llama-3-70b',
  prompt: 'Write a detailed analysis of neural networks',
  meshConfig: {
    minNodes: 3,
    maxNodes: 8
  }
});

console.log(result.output);
console.log(\`Processed by \${result.nodes_used} nodes\`);`
  };

  return (
    <div className="min-h-screen space-y-12 pb-16">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link href="/docs">
          <div className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Documentation</span>
          </div>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand/20 border border-brand/30 mb-6">
            <Network className="w-10 h-10 text-brand-soft" />
          </div>

          <h1 className="text-5xl font-bold mb-4 text-white">
            Far Mesh Documentation
          </h1>

          <p className="text-xl text-white/60 leading-relaxed">
            Distributed inference across a mesh network of GPU nodes. Scalable, fault-tolerant, and cost-effective for variable workloads.
          </p>
        </div>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Network, title: 'Distributed Processing', desc: 'Inference split across multiple GPU nodes' },
              { icon: Shield, title: 'Fault Tolerant', desc: 'Automatic failover and redundancy' },
              { icon: Layers, title: 'Dynamic Scaling', desc: 'Add/remove nodes based on demand' },
              { icon: Zap, title: 'Cost Efficient', desc: 'Pay only for chunks processed' }
            ].map((feature) => (
              <Card key={feature.title} className="p-6">
                <feature.icon className="w-8 h-8 text-brand-soft mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Architecture</h2>
          <Card elevated className="p-8">
            <p className="text-white/70 mb-6 leading-relaxed">
              Far Mesh uses a <strong className="text-white">distributed mesh architecture</strong> where inference tasks are split into chunks and processed in parallel across multiple GPU nodes. This provides scalability, fault tolerance, and cost efficiency.
            </p>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Request Flow</h3>
              <ol className="space-y-3 text-white/70">
                <li className="flex gap-3">
                  <span className="text-brand-soft font-mono">1.</span>
                  <span>Client submits inference request with $FAR token deposit</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-soft font-mono">2.</span>
                  <span><strong className="text-white">Coordinator</strong> splits prompt into chunks based on token count</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-soft font-mono">3.</span>
                  <span><strong className="text-white">Scheduler</strong> assigns chunks to available worker nodes</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-soft font-mono">4.</span>
                  <span><strong className="text-white">Workers</strong> process chunks in parallel on their GPUs</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-soft font-mono">5.</span>
                  <span><strong className="text-white">Aggregator</strong> combines results into final output</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-soft font-mono">6.</span>
                  <span>Result returned to client, $FAR distributed to workers proportionally</span>
                </li>
              </ol>
            </div>

            <div className="bg-brand/10 border border-brand/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-brand-soft" />
                Redundancy & Failover
              </h3>
              <p className="text-white/70 leading-relaxed">
                Each chunk can be processed by multiple nodes (redundancy factor). If a node fails or becomes slow,
                the chunk is automatically reassigned to another available node. This ensures 99.9% reliability even
                with unreliable individual nodes.
              </p>
            </div>
          </Card>
        </section>

        {/* Mesh Configuration */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Mesh Configuration</h2>
          <Card elevated className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="text-left p-4 text-white/70 font-semibold">Parameter</th>
                  <th className="text-left p-4 text-white/70 font-semibold">Description</th>
                  <th className="text-left p-4 text-white/70 font-semibold">Default</th>
                  <th className="text-left p-4 text-white/70 font-semibold">Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 text-white font-mono">min_nodes</td>
                  <td className="p-4 text-white/70">Minimum nodes required</td>
                  <td className="p-4 text-white/70">2</td>
                  <td className="p-4 text-white/70">1-100</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">max_nodes</td>
                  <td className="p-4 text-white/70">Maximum nodes to use</td>
                  <td className="p-4 text-white/70">10</td>
                  <td className="p-4 text-white/70">1-100</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">chunk_size</td>
                  <td className="p-4 text-white/70">Tokens per chunk</td>
                  <td className="p-4 text-white/70">256</td>
                  <td className="p-4 text-white/70">64-1024</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">redundancy</td>
                  <td className="p-4 text-white/70">Nodes per chunk</td>
                  <td className="p-4 text-white/70">2</td>
                  <td className="p-4 text-white/70">1-5</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">timeout_ms</td>
                  <td className="p-4 text-white/70">Max processing time</td>
                  <td className="p-4 text-white/70">30000</td>
                  <td className="p-4 text-white/70">1000-120000</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        {/* Supported Models */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Supported Models</h2>
          <Card elevated className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="text-left p-4 text-white/70 font-semibold">Model</th>
                  <th className="text-left p-4 text-white/70 font-semibold">Parameters</th>
                  <th className="text-left p-4 text-white/70 font-semibold">Parallelizable</th>
                  <th className="text-right p-4 text-white/70 font-semibold">Cost ($FAR/chunk)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 text-white font-mono">llama-3-8b</td>
                  <td className="p-4 text-white/70">8B</td>
                  <td className="p-4"><span className="text-brand-accent">✓ Yes</span></td>
                  <td className="p-4 text-right text-brand-accent">0.00002</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">llama-3-70b</td>
                  <td className="p-4 text-white/70">70B</td>
                  <td className="p-4"><span className="text-brand-accent">✓ Yes</span></td>
                  <td className="p-4 text-right text-brand-accent">0.0002</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">mistral-7b</td>
                  <td className="p-4 text-white/70">7B</td>
                  <td className="p-4"><span className="text-brand-accent">✓ Yes</span></td>
                  <td className="p-4 text-right text-brand-accent">0.000015</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">codellama-34b</td>
                  <td className="p-4 text-white/70">34B</td>
                  <td className="p-4"><span className="text-brand-accent">✓ Yes</span></td>
                  <td className="p-4 text-right text-brand-accent">0.0001</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">stable-diffusion-xl</td>
                  <td className="p-4 text-white/70">3.5B</td>
                  <td className="p-4"><span className="text-yellow-400">⚠ Partial</span></td>
                  <td className="p-4 text-right text-brand-accent">0.0004 per image</td>
                </tr>
              </tbody>
            </table>
          </Card>
          <p className="text-sm text-white/60 mt-4">
            * Costs are per 256-token chunk. Total cost = (chunks × redundancy factor × cost per chunk)
          </p>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Code className="w-8 h-8 text-brand-soft" />
            API Reference
          </h2>

          {/* Python Example */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-white">Python Client</h3>
              <button
                onClick={() => copyToClipboard(codeExamples.python, 'python')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-white/70"
              >
                {copiedSection === 'python' ? (
                  <>
                    <Check className="w-4 h-4 text-brand-accent" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-black/50 rounded-2xl p-6 border border-white/5 overflow-x-auto">
              <pre className="text-sm text-white/70 font-mono">
                <code>{codeExamples.python}</code>
              </pre>
            </div>
          </div>

          {/* cURL Example */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-white">cURL</h3>
              <button
                onClick={() => copyToClipboard(codeExamples.curl, 'curl')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-white/70"
              >
                {copiedSection === 'curl' ? (
                  <>
                    <Check className="w-4 h-4 text-brand-accent" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-black/50 rounded-2xl p-6 border border-white/5 overflow-x-auto">
              <pre className="text-sm text-white/70 font-mono">
                <code>{codeExamples.curl}</code>
              </pre>
            </div>
          </div>

          {/* Node.js Example */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-white">Node.js / TypeScript</h3>
              <button
                onClick={() => copyToClipboard(codeExamples.nodejs, 'nodejs')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-white/70"
              >
                {copiedSection === 'nodejs' ? (
                  <>
                    <Check className="w-4 h-4 text-brand-accent" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-black/50 rounded-2xl p-6 border border-white/5 overflow-x-auto">
              <pre className="text-sm text-white/70 font-mono">
                <code>{codeExamples.nodejs}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Best Practices</h2>
          <div className="space-y-4">
            <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-6">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-brand-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DO: Use for variable workloads</h3>
                  <p className="text-white/70">Far Mesh excels with unpredictable traffic patterns. The mesh automatically scales based on demand.</p>
                </div>
              </div>
            </div>

            <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-6">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-brand-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DO: Set appropriate redundancy</h3>
                  <p className="text-white/70">Use redundancy=2 or 3 for production workloads to ensure reliability. Higher redundancy = higher cost but better fault tolerance.</p>
                </div>
              </div>
            </div>

            <div className="bg-brand-accent/10 border border-brand-accent/30 rounded-2xl p-6">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-brand-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DO: Tune chunk size</h3>
                  <p className="text-white/70">Smaller chunks = more parallelism but higher overhead. Larger chunks = less overhead but less parallelism. Start with 256 tokens.</p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DON'T: Use for ultra-low latency</h3>
                  <p className="text-white/70">Far Mesh adds 100-200ms overhead for coordination. If you need sub-100ms latency, use Far Mono instead.</p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DON'T: Set min_nodes too high</h3>
                  <p className="text-white/70">Setting min_nodes=20 means your request will fail if fewer than 20 nodes are available. Start conservative.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Performance Metrics</h2>
          <Card elevated className="p-8">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-soft mb-2">100-300ms</div>
                <div className="text-white/60">Average Latency</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-accent mb-2">99.9%</div>
                <div className="text-white/60">Reliability</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand mb-2">10,000+</div>
                <div className="text-white/60">Concurrent requests</div>
              </div>
            </div>

            <div className="bg-brand/10 border border-brand/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Scaling Performance</h3>
              <p className="text-white/70 mb-4">
                Far Mesh scales linearly with the number of nodes. Adding more nodes increases throughput without increasing latency.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-brand-soft">2x</div>
                  <div className="text-sm text-white/60">at 10 nodes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-soft">5x</div>
                  <div className="text-sm text-white/60">at 25 nodes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-soft">10x</div>
                  <div className="text-sm text-white/60">at 50+ nodes</div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Cost Comparison */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Cost Comparison</h2>
          <Card elevated className="p-8">
            <p className="text-white/70 mb-6">
              Far Mesh is typically 20-30% more expensive than Far Mono due to redundancy and coordination overhead,
              but offers much better scalability and fault tolerance.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-brand-soft mb-4">Far Mono</h3>
                <div className="space-y-2 text-white/70">
                  <div className="flex justify-between">
                    <span>1000 tokens (Llama-3-70B)</span>
                    <span className="font-mono text-white">0.001 $FAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead</span>
                    <span className="font-mono text-brand-accent">Minimal</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-mono text-white font-semibold">0.001 $FAR</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-brand/30">
                <h3 className="text-lg font-semibold text-brand mb-4">Far Mesh (redundancy=2)</h3>
                <div className="space-y-2 text-white/70">
                  <div className="flex justify-between">
                    <span>1000 tokens (4 chunks)</span>
                    <span className="font-mono text-white">0.0008 $FAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Redundancy (×2)</span>
                    <span className="font-mono text-white">+0.0008 $FAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordination overhead</span>
                    <span className="font-mono text-white">+0.0002 $FAR</span>
                  </div>
                  <div className="flex justify-between border-t border-brand/30 pt-2 mt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-mono text-white font-semibold">0.0018 $FAR</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
              <p className="text-sm text-yellow-200">
                <strong>Pro tip:</strong> Far Mesh becomes more cost-effective at scale due to better GPU utilization across the network.
                Single large requests may cost more, but overall platform efficiency is higher.
              </p>
            </div>
          </Card>
        </section>

        {/* Getting Started CTA */}
        <section>
          <Card elevated className="p-8 text-center border-2 border-brand/30">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to scale with Far Mesh?</h2>
            <p className="text-white/70 mb-6">Join the distributed inference revolution. Get your API key and start building resilient applications.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <button className="px-6 py-3 bg-brand hover:bg-brand-soft text-white font-semibold rounded-xl transition-colors">
                  Get API Key
                </button>
              </Link>
              <Link href="/docs/far-mono">
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-colors border border-white/10">
                  Compare with Far Mono
                </button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
