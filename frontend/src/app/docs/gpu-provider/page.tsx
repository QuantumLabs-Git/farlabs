'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Copy, Check, Download, Terminal, Cpu,
  HardDrive, Wifi, DollarSign, Zap, Shield, CheckCircle,
  Play, ExternalLink, Github
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function GpuProviderDocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const quickStartCommands = {
    download: `mkdir -p ~/FarLabs && cd ~/FarLabs
git clone https://github.com/QuantumLabs-Git/farlabs.git
cd farlabs/backend/services/gpu_worker_client`,

    install: `python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt`,

    configure: `cat > config.env << 'EOF'
FARLABS_API_BASE_URL=http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com
FARLABS_REDIS_URL=redis://farlabs-redis-free.cc9c2a8ueo1d.us-east-1.rds.amazonaws.com:6379
FARLABS_WALLET_ADDRESS=0xYOUR_WALLET_ADDRESS
FARLABS_GPU_MODEL=Apple-M1-GPU
FARLABS_VRAM_GB=8
FARLABS_LOCATION=US-California
FARLABS_EXECUTOR=mock
FARLABS_AUTH_REFRESH_ENABLED=true
EOF`,

    getToken: `export YOUR_WALLET="0xYourWalletAddress"

curl -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \\
  -H 'Content-Type: application/json' \\
  -d "{\\"wallet_address\\":\\"$YOUR_WALLET\\",\\"session_tag\\":\\"gpu-provider\\"}"`,

    start: `python -m farlabs_gpu_worker run --env-file config.env`,

    upgrade: `# Install AI packages
source .venv/bin/activate
pip install torch torchvision torchaudio transformers accelerate

# Update config.env:
FARLABS_EXECUTOR=huggingface
FARLABS_EXECUTOR_DEVICE=mps
FARLABS_EXECUTOR_DTYPE=float16
FARLABS_EXECUTOR_MODEL_MAP={"gpt2":"gpt2","phi-2":"microsoft/phi-2"}`,

    monitor: `# Get fresh token
export FAR_TOKEN=$(curl -s -X POST 'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/auth/login' \\
  -H 'Content-Type: application/json' \\
  -d "{\\"wallet_address\\":\\"$YOUR_WALLET\\",\\"session_tag\\":\\"check\\"}" \\
  | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Check balance
curl -H "Authorization: Bearer $FAR_TOKEN" \\
  'http://farlabs-alb-free-1564980524.us-east-1.elb.amazonaws.com/api/payments/balances'`,

    run247: `# Use screen to keep running
screen -S farlabs
cd ~/FarLabs/farlabs/backend/services/gpu_worker_client
source .venv/bin/activate
python -m farlabs_gpu_worker run --env-file config.env

# Detach: Press Ctrl+A then D
# Reattach later: screen -r farlabs`
  };

  const requirements = [
    { icon: Cpu, label: 'Apple Silicon', detail: 'M1, M2, or M3 chip' },
    { icon: HardDrive, label: 'Memory', detail: '8GB+ RAM (16GB+ recommended)' },
    { icon: Wifi, label: 'Internet', detail: 'Stable connection, 10+ Mbps upload' },
    { icon: Terminal, label: 'OS', detail: 'macOS 12.0 (Monterey) or later' }
  ];

  const earningsPotential = [
    { hardware: 'M1 8GB', daily: '$2-5', monthly: '$50-150', usage: 'Part-time, small models' },
    { hardware: 'M1 Pro 16GB', daily: '$7-15', monthly: '$200-500', usage: 'Full-time, medium models' },
    { hardware: 'M1 Max 32GB', daily: '$15-30', monthly: '$400-900', usage: 'Full-time, large models' },
    { hardware: 'M1 Ultra 64GB', daily: '$30-50+', monthly: '$900-1500+', usage: '24/7, large models' }
  ];

  const features = [
    {
      icon: DollarSign,
      title: 'Passive Income',
      description: 'Earn $FAR tokens automatically while your Mac processes AI inference tasks'
    },
    {
      icon: Zap,
      title: 'Easy Setup',
      description: '5-minute installation with simple command-line setup. No complex configuration required'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your hardware, your control. No private keys exposed, only public wallet address needed'
    }
  ];

  return (
    <div className="min-h-screen space-y-16">
      {/* Back Button */}
      <Link href="/docs">
        <Button variant="ghost" className="group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Docs
        </Button>
      </Link>

      {/* Hero Section */}
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-2">
            <Cpu className="w-4 h-4 text-brand-soft" />
            <span className="text-brand-soft text-sm font-medium">GPU Provider Guide</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Become a GPU Provider
          </h1>

          <p className="text-xl text-white/60 max-w-3xl">
            Turn your Mac M1/M2/M3 into a GPU provider and earn $FAR tokens by processing AI inference tasks on the Far Labs decentralized network.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#quick-start">
              <Button>
                <Play className="w-4 h-4 mr-2" />
                Quick Start Guide
              </Button>
            </a>
            <a href="https://github.com/QuantumLabs-Git/farlabs" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost">
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} elevated className="space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30">
              <feature.icon className="w-6 h-6 text-brand-soft" />
            </div>
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="text-sm text-white/60">{feature.description}</p>
          </Card>
        ))}
      </div>

      {/* System Requirements */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">System Requirements</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {requirements.map((req) => (
            <Card key={req.label} elevated className="space-y-4">
              <req.icon className="w-6 h-6 text-brand-soft" />
              <h3 className="text-lg font-semibold text-white">{req.label}</h3>
              <p className="text-sm text-white/60">{req.detail}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Earnings Potential */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">Earnings Potential</h2>
        <Card elevated>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-white/60 font-medium">Hardware</th>
                  <th className="text-center p-4 text-white/60 font-medium">Daily</th>
                  <th className="text-center p-4 text-white/60 font-medium">Monthly</th>
                  <th className="text-left p-4 text-white/60 font-medium">Usage Pattern</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                {earningsPotential.map((tier, index) => (
                  <tr key={tier.hardware} className={index !== earningsPotential.length - 1 ? 'border-b border-white/5' : ''}>
                    <td className="p-4 font-semibold text-white">{tier.hardware}</td>
                    <td className="p-4 text-center text-brand-soft">{tier.daily}</td>
                    <td className="p-4 text-center text-brand-soft font-semibold">{tier.monthly}</td>
                    <td className="p-4 text-white/60">{tier.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-brand/10 border border-brand/20 rounded-xl">
            <p className="text-sm text-white/60">
              <strong className="text-brand-soft">Note:</strong> Earnings vary based on network demand, uptime, and your hardware specifications. Higher uptime and reliability result in better task assignment priority.
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <div id="quick-start" className="space-y-6">
        <h2 className="text-3xl font-bold text-white">Quick Start Guide</h2>
        <p className="text-white/60">Get your Mac earning $FAR tokens in just 5 minutes</p>

        {/* Step 1: Download */}
        <Card elevated className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/20 text-brand-soft font-semibold">
                1
              </div>
              <h3 className="text-2xl font-semibold text-white">Download the GPU Worker</h3>
            </div>
            <Download className="w-6 h-6 text-brand-soft" />
          </div>
          <p className="text-white/60 pl-14">Clone the repository from GitHub</p>
          <div className="pl-14">
            <div className="relative">
              <pre className="p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                <code className="text-sm text-white/80">{quickStartCommands.download}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(quickStartCommands.download, 'download')}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copiedSection === 'download' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
        </Card>

        {/* Step 2: Install */}
        <Card elevated className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/20 text-brand-soft font-semibold">
              2
            </div>
            <h3 className="text-2xl font-semibold text-white">Install Dependencies</h3>
          </div>
          <p className="text-white/60 pl-14">Set up Python virtual environment and install required packages</p>
          <div className="pl-14">
            <div className="relative">
              <pre className="p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                <code className="text-sm text-white/80">{quickStartCommands.install}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(quickStartCommands.install, 'install')}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copiedSection === 'install' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
        </Card>

        {/* Step 3: Configure */}
        <Card elevated className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/20 text-brand-soft font-semibold">
              3
            </div>
            <h3 className="text-2xl font-semibold text-white">Configure Your Worker</h3>
          </div>
          <p className="text-white/60 pl-14">Create configuration file with your wallet address</p>
          <div className="pl-14">
            <div className="relative">
              <pre className="p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                <code className="text-sm text-white/80">{quickStartCommands.configure}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(quickStartCommands.configure, 'configure')}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copiedSection === 'configure' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
          <div className="pl-14 flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <CheckCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-sm text-white/80">
              Edit <code className="text-brand-soft">config.env</code> and replace <code className="text-brand-soft">0xYOUR_WALLET_ADDRESS</code> with your actual wallet address
            </p>
          </div>
        </Card>

        {/* Step 4: Get Token */}
        <Card elevated className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/20 text-brand-soft font-semibold">
              4
            </div>
            <h3 className="text-2xl font-semibold text-white">Get Authentication Token</h3>
          </div>
          <p className="text-white/60 pl-14">Obtain a JWT token for API authentication</p>
          <div className="pl-14">
            <div className="relative">
              <pre className="p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                <code className="text-sm text-white/80">{quickStartCommands.getToken}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(quickStartCommands.getToken, 'getToken')}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copiedSection === 'getToken' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
          <div className="pl-14 flex items-start gap-3 p-4 bg-brand/10 border border-brand/20 rounded-xl">
            <CheckCircle className="w-5 h-5 text-brand-soft shrink-0 mt-0.5" />
            <p className="text-sm text-white/80">
              Copy the token from the response and add it to your <code className="text-brand-soft">config.env</code> file as <code className="text-brand-soft">FARLABS_API_TOKEN</code>
            </p>
          </div>
        </Card>

        {/* Step 5: Start */}
        <Card elevated className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/20 text-brand-soft font-semibold">
              5
            </div>
            <h3 className="text-2xl font-semibold text-white">Start Your Worker</h3>
          </div>
          <p className="text-white/60 pl-14">Launch the GPU worker and start earning!</p>
          <div className="pl-14">
            <div className="relative">
              <pre className="p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                <code className="text-sm text-white/80">{quickStartCommands.start}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(quickStartCommands.start, 'start')}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copiedSection === 'start' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
          <div className="pl-14 space-y-2">
            <p className="text-white/60 font-medium">You should see:</p>
            <pre className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl overflow-x-auto">
              <code className="text-sm text-emerald-400">{`[INFO] Far Labs GPU Worker starting...
[INFO] ✓ Registered as node_xyz123
[INFO] ✓ Heartbeat sent (uptime: 0s, score: 100.0)
[INFO] Listening for tasks...`}</code>
            </pre>
          </div>
        </Card>

        <div className="flex items-center justify-center p-6 bg-gradient-to-r from-brand/20 via-brand-soft/20 to-brand/20 border border-brand/30 rounded-2xl">
          <div className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-brand-soft mx-auto" />
            <h3 className="text-2xl font-bold text-white">Congratulations!</h3>
            <p className="text-white/60">You're now earning $FAR tokens with your Mac GPU</p>
          </div>
        </div>
      </div>

      {/* Advanced: Upgrade to Real AI */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">Upgrade to Real AI Inference</h2>
        <p className="text-white/60">
          The basic setup uses "mock" mode for testing. Upgrade to process real AI models and maximize your earnings.
        </p>
        <Card elevated className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Install AI Packages</h3>
            <div className="relative">
              <pre className="p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                <code className="text-sm text-white/80">{quickStartCommands.upgrade}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(quickStartCommands.upgrade, 'upgrade')}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copiedSection === 'upgrade' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-brand/10 border border-brand/20 rounded-xl">
            <Zap className="w-5 h-5 text-brand-soft shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Model Recommendations</p>
              <ul className="text-sm text-white/60 space-y-1">
                <li><strong className="text-white">M1/M2 8GB:</strong> gpt2, phi-2 (2-3B parameters)</li>
                <li><strong className="text-white">M1 Pro/Max 16-32GB:</strong> Llama-2-7b, Mistral-7B</li>
                <li><strong className="text-white">M1 Ultra 64GB+:</strong> Llama-2-13b, CodeLlama-13b</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Monitoring Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">Monitor Your Earnings</h2>
        <Card elevated className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Check Your Balance</h3>
            <div className="relative">
              <pre className="p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                <code className="text-sm text-white/80">{quickStartCommands.monitor}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(quickStartCommands.monitor, 'monitor')}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copiedSection === 'monitor' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/gpu">
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-brand/10 hover:border-brand/20 transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">View GPU Dashboard</span>
                  <ExternalLink className="w-4 h-4 text-brand-soft group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-sm text-white/60 mt-2">See all registered GPU nodes and stats</p>
              </div>
            </Link>
            <Link href="/dashboard">
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-brand/10 hover:border-brand/20 transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">View Your Dashboard</span>
                  <ExternalLink className="w-4 h-4 text-brand-soft group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-sm text-white/60 mt-2">Track your earnings and performance</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Running 24/7 */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white">Running 24/7 (Maximize Earnings)</h2>
        <Card elevated className="space-y-6">
          <p className="text-white/60">
            Keep your worker running continuously to maximize earnings and improve your reliability score.
          </p>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Using Screen</h3>
            <div className="relative">
              <pre className="p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                <code className="text-sm text-white/80">{quickStartCommands.run247}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(quickStartCommands.run247, 'run247')}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {copiedSection === 'run247' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Support Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card elevated className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Need Help?</h3>
          <p className="text-white/60">
            Join our community for support, updates, and troubleshooting assistance.
          </p>
          <div className="flex gap-3">
            <a href="https://github.com/QuantumLabs-Git/farlabs/issues" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <Github className="w-4 h-4 mr-2" />
                GitHub Issues
              </Button>
            </a>
          </div>
        </Card>
        <Card elevated className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Download Worker</h3>
          <p className="text-white/60">
            Get the GPU worker software and start earning today.
          </p>
          <div className="flex gap-3">
            <Link href="/gpu/download">
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Page
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
