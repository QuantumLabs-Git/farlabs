'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Download, Terminal, Container, Package, CheckCircle2, AlertCircle, Cpu, HardDrive, Wifi, Monitor } from 'lucide-react';
import { useState } from 'react';

const requirements = [
  { icon: Cpu, label: 'NVIDIA GPU', detail: '8GB+ VRAM (RTX 3060 or better)' },
  { icon: HardDrive, label: 'Storage', detail: '50GB free space' },
  { icon: Wifi, label: 'Internet', detail: '10+ Mbps upload speed' },
  { icon: Monitor, label: 'OS', detail: 'Windows 10+, macOS 11+, Ubuntu 20.04+' }
];

const installMethods = [
  {
    id: 'docker',
    icon: Container,
    title: 'Docker',
    subtitle: 'Recommended - Easiest Setup',
    badge: 'Ready',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
    steps: [
      'Install Docker Desktop',
      'Run one command to start earning',
      'Auto-updates and monitoring included'
    ]
  },
  {
    id: 'python',
    icon: Terminal,
    title: 'Python',
    subtitle: 'For Advanced Users',
    badge: 'Ready',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
    steps: [
      'Clone from GitHub',
      'Install dependencies',
      'Full control over configuration'
    ]
  },
  {
    id: 'installer',
    icon: Package,
    title: 'Native Installer',
    subtitle: 'One-Click GUI',
    badge: 'Coming Soon',
    badgeColor: 'bg-brand/20 text-brand-soft',
    steps: [
      'Windows .exe installer',
      'macOS .dmg package',
      'Linux AppImage'
    ]
  }
];

const earnings = [
  { gpu: 'RTX 3080', daily: '50-100', monthly: '1.5K-3K' },
  { gpu: 'RTX 4090', daily: '150-300', monthly: '4.5K-9K' },
  { gpu: 'A100 80GB', daily: '500-1000', monthly: '15K-30K' }
];

export default function GpuDownloadPage() {
  const [selectedMethod, setSelectedMethod] = useState('docker');
  const [selectedWorkerType, setSelectedWorkerType] = useState<'mono' | 'mesh'>('mono');
  const [copiedCommand, setCopiedCommand] = useState(false);

  const dockerCommandMono = `docker run --gpus all \\
  -e FARLABS_WALLET_ADDRESS=0xYOUR_WALLET \\
  -e FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com \\
  -e FARLABS_AUTH_REFRESH_ENABLED=True \\
  --restart unless-stopped \\
  894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-gpu-worker-free:latest`;

  const dockerCommandMesh = `docker run --gpus all \\
  -e FARLABS_WALLET_ADDRESS=0xYOUR_WALLET \\
  -e FARLABS_DHT_BOOTSTRAP=/ip4/34.239.181.168/tcp/31337/p2p/QmBootstrapPeer \\
  -e FARLABS_MODEL_NAME=meta-llama/Llama-2-7b-chat-hf \\
  -e FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com \\
  --restart unless-stopped \\
  894059646844.dkr.ecr.us-east-1.amazonaws.com/farlabs-far-mesh-worker-free:latest`;

  const dockerCommand = selectedWorkerType === 'mono' ? dockerCommandMono : dockerCommandMesh;

  const copyCommand = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-white">Download GPU Worker</h1>
          <p className="text-sm text-white/60">
            Turn your idle GPU into a revenue-generating asset. Join thousands of providers earning $FAR tokens
            by contributing compute to the Far Labs decentralized inference network.
          </p>
          <div className="flex gap-4">
            <a href="#install">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            </a>
            <Link href="/docs/gpu-worker">
              <Button variant="ghost">Documentation</Button>
            </Link>
          </div>
        </div>
        <Card elevated className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Earnings Potential</p>
          <div className="space-y-4">
            {earnings.map((tier) => (
              <div key={tier.gpu} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{tier.gpu}</p>
                  <p className="text-sm text-brand-soft">~{tier.daily} $FAR/day</p>
                </div>
                <p className="text-xs text-white/50">Monthly: ~{tier.monthly} $FAR</p>
                <p className="mt-2 text-xs text-emerald-400">Estimated based on network demand</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Quick Start Guide */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold text-white">Quick Start</h2>
          <p className="mt-2 text-sm text-white/60">
            Get your GPU earning $FAR tokens in less than 5 minutes
          </p>
        </div>

        <Card elevated className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-lg font-semibold text-brand-soft">
                  1
                </div>
                <Download className="h-5 w-5 text-brand-soft" />
              </div>
              <h3 className="text-lg font-semibold text-white">Install Docker</h3>
              <p className="text-sm text-white/60">
                Download Docker Desktop and install NVIDIA drivers + Container Toolkit
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">Get Docker</Button>
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-lg font-semibold text-brand-soft">
                  2
                </div>
                <Terminal className="h-5 w-5 text-brand-soft" />
              </div>
              <h3 className="text-lg font-semibold text-white">Run One Command</h3>
              <p className="text-sm text-white/60">
                Copy the Docker command below, replace your wallet address, and run it
              </p>
              <a href="#install">
                <Button variant="ghost" size="sm">View Command</Button>
              </a>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-lg font-semibold text-brand-soft">
                  3
                </div>
                <CheckCircle2 className="h-5 w-5 text-brand-soft" />
              </div>
              <h3 className="text-lg font-semibold text-white">Start Earning</h3>
              <p className="text-sm text-white/60">
                Your GPU will automatically process tasks and stream $FAR rewards to your wallet
              </p>
              <Link href="/gpu">
                <Button variant="ghost" size="sm">View Dashboard</Button>
              </Link>
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="relative">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-brand" />
                <span className="text-xs text-white/50">2 min</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-brand" />
                <span className="text-xs text-white/50">1 min</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">Earning!</span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Worker Type Selection */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold text-white">Choose Your Worker Type</h2>
          <p className="mt-2 text-sm text-white/60">
            Select the inference architecture that best fits your use case
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Far Mono Worker */}
          <Card
            elevated
            className={`cursor-pointer space-y-4 transition-all duration-300 ${
              selectedWorkerType === 'mono'
                ? 'border-brand ring-2 ring-brand/40'
                : 'border-white/10 hover:border-brand/40'
            }`}
            onClick={() => setSelectedWorkerType('mono')}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-white">Far Mono Worker</h3>
                <p className="text-sm text-brand-soft">Single-GPU Inference</p>
              </div>
              {selectedWorkerType === 'mono' && (
                <CheckCircle2 className="h-6 w-6 text-brand-soft" />
              )}
            </div>
            <p className="text-sm text-white/60">
              Run complete models on a single GPU. Best for users with powerful GPUs (RTX 3080+, A100)
              who want maximum performance and simplicity.
            </p>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Key Features</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Fastest inference latency</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Runs entire models locally</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Higher earnings per task</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-white/50">Recommended GPU</p>
              <p className="text-sm font-semibold text-white">RTX 3080 • RTX 4090 • A100 • H100</p>
            </div>
          </Card>

          {/* Far Mesh Worker */}
          <Card
            elevated
            className={`cursor-pointer space-y-4 transition-all duration-300 ${
              selectedWorkerType === 'mesh'
                ? 'border-brand ring-2 ring-brand/40'
                : 'border-white/10 hover:border-brand/40'
            }`}
            onClick={() => setSelectedWorkerType('mesh')}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-white">Far Mesh Worker</h3>
                <p className="text-sm text-brand-soft">Distributed Inference (Petals)</p>
              </div>
              {selectedWorkerType === 'mesh' && (
                <CheckCircle2 className="h-6 w-6 text-brand-soft" />
              )}
            </div>
            <p className="text-sm text-white/60">
              Join a distributed network running large models collaboratively. Perfect for consumer
              GPUs (RTX 3060+) to participate in running massive models like Llama-70B.
            </p>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Key Features</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Run models larger than your VRAM</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Lower VRAM requirements (8GB+)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Access to premium models</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-white/50">Recommended GPU</p>
              <p className="text-sm font-semibold text-white">RTX 3060 • RTX 3070 • RTX 4060 Ti</p>
            </div>
          </Card>
        </div>
      </section>

      {/* System Requirements */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {requirements.map((req) => (
          <Card key={req.label} elevated className="space-y-4">
            <req.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="text-lg font-semibold text-white">{req.label}</h3>
            <p className="text-sm text-white/60">{req.detail}</p>
          </Card>
        ))}
      </section>

      {/* Installation Methods */}
      <section id="install" className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold text-white">Choose Your Installation Method</h2>
          <p className="mt-2 text-sm text-white/60">
            Select the method that best fits your technical comfort level
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {installMethods.map((method) => (
            <Card
              key={method.id}
              elevated
              className={`cursor-pointer space-y-4 transition-all duration-300 ${
                selectedMethod === method.id
                  ? 'border-brand ring-2 ring-brand/40'
                  : 'border-white/10 hover:border-brand/40'
              }`}
              onClick={() => method.badge === 'Ready' && setSelectedMethod(method.id)}
            >
              <div className="flex items-start justify-between">
                <method.icon className="h-6 w-6 text-brand-soft" />
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${method.badgeColor}`}>
                  {method.badge}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white">{method.title}</h3>
              <p className="text-sm text-white/50">{method.subtitle}</p>
              <ul className="space-y-2">
                {method.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Docker Installation */}
      {selectedMethod === 'docker' && (
        <section className="space-y-6">
          <Card elevated className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold text-white">Docker Installation</h3>
                <p className="text-sm text-brand-soft">
                  {selectedWorkerType === 'mono' ? 'Far Mono Worker - Single-GPU Inference' : 'Far Mesh Worker - Distributed Inference'}
                </p>
              </div>
              <Container className="h-8 w-8 text-brand-soft" />
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">
                    1
                  </div>
                  <h4 className="text-lg font-semibold text-white">Install Docker</h4>
                </div>
                <p className="text-sm text-white/60 pl-11">
                  Download and install Docker Desktop for your operating system
                </p>
                <div className="pl-11 flex gap-3">
                  <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">Windows / Mac</Button>
                  </a>
                  <a href="https://docs.docker.com/engine/install/" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">Linux</Button>
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">
                    2
                  </div>
                  <h4 className="text-lg font-semibold text-white">Install NVIDIA Drivers</h4>
                </div>
                <p className="text-sm text-white/60 pl-11">
                  Ensure you have the latest NVIDIA drivers and CUDA toolkit installed
                </p>
                <div className="pl-11 flex gap-3">
                  <a href="https://www.nvidia.com/Download/index.aspx" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">NVIDIA Drivers</Button>
                  </a>
                  <a href="https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">Container Toolkit</Button>
                  </a>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">
                    3
                  </div>
                  <h4 className="text-lg font-semibold text-white">Run the Worker</h4>
                </div>
                <p className="text-sm text-white/60 pl-11">
                  Replace <code className="text-brand-soft">0xYOUR_WALLET</code> with your actual wallet address
                </p>
                <div className="pl-11">
                  <div className="relative rounded-xl border border-white/10 bg-black/40 p-4">
                    <pre className="overflow-x-auto text-sm text-white/80">
                      <code>{dockerCommand}</code>
                    </pre>
                    <button
                      onClick={copyCommand}
                      className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
                    >
                      {copiedCommand ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">
                    4
                  </div>
                  <h4 className="text-lg font-semibold text-white">Verify Registration</h4>
                </div>
                <p className="text-sm text-white/60 pl-11">
                  Check that your GPU node appears on the dashboard
                </p>
                <div className="pl-11">
                  <Link href="/gpu">
                    <Button variant="ghost" size="sm">View Dashboard</Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/10 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-brand-soft" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Beta Access Required</p>
                <p className="text-sm text-white/60">
                  The Docker image is currently in private beta. Contact us on Discord for access credentials,
                  or wait for public release coming soon.
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Python Installation */}
      {selectedMethod === 'python' && (
        <section className="space-y-6">
          <Card elevated className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold text-white">Python Installation</h3>
                <p className="text-sm text-brand-soft">
                  {selectedWorkerType === 'mono' ? 'Far Mono Worker - Single-GPU Inference' : 'Far Mesh Worker - Distributed Inference'}
                </p>
              </div>
              <Terminal className="h-8 w-8 text-brand-soft" />
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">
                    1
                  </div>
                  <h4 className="text-lg font-semibold text-white">Clone Repository</h4>
                </div>
                <div className="pl-11">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <pre className="overflow-x-auto text-sm text-white/80">
                      <code>{selectedWorkerType === 'mono'
                        ? `git clone https://github.com/farlabs/farlabs-platform.git
cd farlabs-platform/backend/services/gpu_worker_client`
                        : `git clone https://github.com/farlabs/farlabs-platform.git
cd farlabs-platform/backend/services/far_mesh_worker`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">
                    2
                  </div>
                  <h4 className="text-lg font-semibold text-white">Install Dependencies</h4>
                </div>
                <div className="pl-11">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <pre className="overflow-x-auto text-sm text-white/80">
                      <code>{`python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
pip install -r requirements.txt`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">
                    3
                  </div>
                  <h4 className="text-lg font-semibold text-white">Configure Environment</h4>
                </div>
                <p className="text-sm text-white/60 pl-11">
                  Create a <code className="text-brand-soft">.env</code> file with your configuration
                </p>
                <div className="pl-11">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <pre className="overflow-x-auto text-sm text-white/80">
                      <code>{selectedWorkerType === 'mono'
                        ? `FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_WALLET_ADDRESS=0xYOUR_WALLET_HERE
FARLABS_AUTH_REFRESH_ENABLED=True
FARLABS_EXECUTOR=huggingface
FARLABS_EXECUTOR_DEVICE=cuda`
                        : `FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_WALLET_ADDRESS=0xYOUR_WALLET_HERE
FARLABS_DHT_BOOTSTRAP=/ip4/34.239.181.168/tcp/31337/p2p/QmBootstrapPeer
FARLABS_MODEL_NAME=meta-llama/Llama-2-7b-chat-hf
FARLABS_LOCATION=US-East`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-soft">
                    4
                  </div>
                  <h4 className="text-lg font-semibold text-white">Run the Worker</h4>
                </div>
                <div className="pl-11">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <pre className="overflow-x-auto text-sm text-white/80">
                      <code>{selectedWorkerType === 'mono'
                        ? 'python -m farlabs_gpu_worker run'
                        : 'python main.py'}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Support Section */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card elevated className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Need Help?</h3>
          <p className="text-sm text-white/60">
            Join our community for support, updates, and to connect with other GPU providers
          </p>
          <div className="flex gap-3">
            <a href="https://discord.gg/farlabs" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">Discord</Button>
            </a>
            <a href="https://t.me/farlabs_support" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">Telegram</Button>
            </a>
          </div>
        </Card>

        <Card elevated className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Documentation</h3>
          <p className="text-sm text-white/60">
            Comprehensive guides, API references, and troubleshooting tips
          </p>
          <div className="flex gap-3">
            <Link href="/docs/gpu-worker">
              <Button variant="ghost" size="sm">Setup Guide</Button>
            </Link>
            <Link href="/docs/troubleshooting">
              <Button variant="ghost" size="sm">Troubleshooting</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
