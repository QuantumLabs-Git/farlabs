'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cpu, ArrowLeft, Zap, Server, Code, Terminal, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';

export default function FarMonoDocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const codeExamples = {
    python: `import requests
import json

# Far Mono Inference API
API_URL = "https://api.farlabs.ai/v1/inference"
API_KEY = "your_api_key_here"

# Submit inference request
def run_inference(prompt: str, model: str = "llama-3-70b"):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "prompt": prompt,
        "max_tokens": 2048,
        "temperature": 0.7,
        "stream": False
    }

    response = requests.post(
        f"{API_URL}/mono/infer",
        headers=headers,
        json=payload
    )

    return response.json()

# Example usage
result = run_inference("Explain quantum computing in simple terms")
print(result["output"])
print(f"Tokens used: {result['usage']['total_tokens']}")
print(f"Cost: {result['cost_far']} $FAR")`,

    curl: `# Submit inference request to Far Mono
curl -X POST https://api.farlabs.ai/v1/inference/mono/infer \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3-70b",
    "prompt": "Explain quantum computing in simple terms",
    "max_tokens": 2048,
    "temperature": 0.7,
    "stream": false
  }'

# Response:
{
  "request_id": "mono_abc123",
  "output": "Quantum computing is...",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 150,
    "total_tokens": 158
  },
  "cost_far": "0.0158",
  "latency_ms": 87,
  "node_id": "gpu-node-01"
}`,

    nodejs: `import axios from 'axios';

const API_URL = 'https://api.farlabs.ai/v1/inference';
const API_KEY = process.env.FAR_API_KEY;

// Far Mono Inference Client
class FarMonoClient {
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
    stream?: boolean;
  }) {
    const response = await this.client.post('/mono/infer', {
      model: params.model,
      prompt: params.prompt,
      max_tokens: params.maxTokens || 2048,
      temperature: params.temperature || 0.7,
      stream: params.stream || false
    });

    return response.data;
  }
}

// Usage
const client = new FarMonoClient(API_KEY);
const result = await client.infer({
  model: 'llama-3-70b',
  prompt: 'Explain quantum computing in simple terms'
});

console.log(result.output);`
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-6 pt-24 pb-16 max-w-5xl">
        {/* Back Button */}
        <Link href="/docs">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Documentation</span>
          </motion.div>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
            <Cpu className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Far Mono Documentation
          </h1>

          <p className="text-xl text-gray-400 leading-relaxed">
            Single-node GPU inference with maximum performance and minimal latency. Perfect for dedicated workloads requiring full GPU control.
          </p>
        </motion.div>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Zap, title: 'Ultra-Low Latency', desc: '50-100ms response times' },
              { icon: Server, title: 'Dedicated GPU', desc: 'Full GPU access per request' },
              { icon: CheckCircle, title: 'High Throughput', desc: 'Optimized for batch processing' },
              { icon: Cpu, title: 'Full Control', desc: 'Direct node access and configuration' }
            ].map((feature) => (
              <div key={feature.title} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <feature.icon className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Architecture</h2>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
            <p className="text-gray-300 mb-6 leading-relaxed">
              Far Mono uses a <strong className="text-white">single-node architecture</strong> where each inference request is processed by a dedicated GPU worker. This provides maximum performance and predictable latency.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700/30">
              <h3 className="text-lg font-semibold text-white mb-4">Request Flow</h3>
              <ol className="space-y-3 text-gray-300">
                <li className="flex gap-3">
                  <span className="text-blue-400 font-mono">1.</span>
                  <span>Client submits inference request via API with $FAR token payment</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-mono">2.</span>
                  <span>Load balancer routes request to available GPU node</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-mono">3.</span>
                  <span>GPU worker loads model into VRAM and processes inference</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-mono">4.</span>
                  <span>Result is returned to client with usage metrics</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400 font-mono">5.</span>
                  <span>$FAR tokens are distributed to node operator</span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Supported Models */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Supported Models</h2>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-semibold">Model</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Parameters</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Min GPU</th>
                  <th className="text-right p-4 text-gray-300 font-semibold">Cost ($FAR/1K tokens)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                <tr>
                  <td className="p-4 text-white font-mono">llama-3-8b</td>
                  <td className="p-4 text-gray-300">8B</td>
                  <td className="p-4 text-gray-300">16GB VRAM</td>
                  <td className="p-4 text-right text-green-400">0.0001</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">llama-3-70b</td>
                  <td className="p-4 text-gray-300">70B</td>
                  <td className="p-4 text-gray-300">48GB VRAM</td>
                  <td className="p-4 text-right text-green-400">0.001</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">mistral-7b</td>
                  <td className="p-4 text-gray-300">7B</td>
                  <td className="p-4 text-gray-300">16GB VRAM</td>
                  <td className="p-4 text-right text-green-400">0.00008</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">codellama-34b</td>
                  <td className="p-4 text-gray-300">34B</td>
                  <td className="p-4 text-gray-300">32GB VRAM</td>
                  <td className="p-4 text-right text-green-400">0.0005</td>
                </tr>
                <tr>
                  <td className="p-4 text-white font-mono">stable-diffusion-xl</td>
                  <td className="p-4 text-gray-300">3.5B</td>
                  <td className="p-4 text-gray-300">12GB VRAM</td>
                  <td className="p-4 text-right text-green-400">0.002 per image</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Code className="w-8 h-8 text-blue-400" />
            API Reference
          </h2>

          {/* Python Example */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-white">Python Client</h3>
              <button
                onClick={() => copyToClipboard(codeExamples.python, 'python')}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300"
              >
                {copiedSection === 'python' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
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
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
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
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300"
              >
                {copiedSection === 'curl' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
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
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
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
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300"
              >
                {copiedSection === 'nodejs' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
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
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
                <code>{codeExamples.nodejs}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Best Practices</h2>
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DO: Use for dedicated workloads</h3>
                  <p className="text-gray-300">Far Mono excels at consistent, high-throughput workloads where you need predictable latency and full GPU control.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DO: Batch requests when possible</h3>
                  <p className="text-gray-300">Group multiple inferences together to maximize GPU utilization and reduce per-request overhead.</p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DON'T: Use for sporadic traffic</h3>
                  <p className="text-gray-300">If your workload has unpredictable spikes, consider Far Mesh instead for better cost efficiency and automatic scaling.</p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">DON'T: Forget to handle errors</h3>
                  <p className="text-gray-300">Single-node architecture means no automatic failover. Always implement retry logic and error handling.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Performance Metrics</h2>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">50-100ms</div>
                <div className="text-gray-400">Average Latency</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
                <div className="text-gray-400">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">1000+</div>
                <div className="text-gray-400">Tokens/second</div>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started CTA */}
        <section>
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-gray-300 mb-6">Get your API key and start running inference in minutes.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                  Get API Key
                </button>
              </Link>
              <Link href="/docs/far-mesh">
                <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors">
                  Compare with Far Mesh
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
