'use client';

import { FormEvent, useState } from 'react';
import { registerGpuNode, RegisterGpuNodeInput } from '@/lib/api/gpu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useWeb3 } from '@/hooks/useWeb3';

interface Props {
  onRegistered?: () => void;
}

const initialState = (wallet?: string | null): RegisterGpuNodeInput => ({
  wallet_address: wallet ?? '',
  gpu_model: '',
  vram_gb: 0,
  bandwidth_gbps: 0,
  location: '',
  notes: ''
});

export function GpuRegistrationForm({ onRegistered }: Props) {
  const { address } = useWeb3();
  const [form, setForm] = useState<RegisterGpuNodeInput>(() => initialState(address ?? ''));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof RegisterGpuNodeInput) => (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    setForm((prev) => ({
      ...prev,
      [key]: key === 'vram_gb' || key === 'bandwidth_gbps' ? Number(value) : value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      await registerGpuNode(form);
      setStatus('success');
      onRegistered?.();
      setForm(initialState(address ?? ''));
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to register node');
    }
  };

  return (
    <Card elevated className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-white/50">Register GPU</p>
        <h3 className="text-xl font-semibold text-white">Onboard a new compute node</h3>
        <p className="text-sm text-white/60">
          Submit your hardware profile to join the Far GPU mesh. Metrics update live once your node starts
          contributing capacity.
        </p>
      </header>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm text-white/70">
          <span>Wallet Address</span>
          <input
            required
            value={form.wallet_address}
            onChange={handleChange('wallet_address')}
            placeholder="0x..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-white/70">
            <span>GPU Model</span>
            <input
              required
              value={form.gpu_model}
              onChange={handleChange('gpu_model')}
              placeholder="NVIDIA A100"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>VRAM (GB)</span>
            <input
              required
              min={1}
              type="number"
              value={form.vram_gb}
              onChange={handleChange('vram_gb')}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-white/70">
            <span>Bandwidth (Gbps)</span>
            <input
              required
              min={0}
              step={0.1}
              type="number"
              value={form.bandwidth_gbps}
              onChange={handleChange('bandwidth_gbps')}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>Location</span>
            <input
              value={form.location ?? ''}
              onChange={handleChange('location')}
              placeholder="Frankfurt, DE"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm text-white/70">
          <span>Notes</span>
          <textarea
            value={form.notes ?? ''}
            onChange={handleChange('notes')}
            rows={3}
            placeholder="Cooling profile, maintenance windows, etc."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
          />
        </label>

        {status === 'success' && (
          <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Node registered. It will appear in your dashboard once heartbeat telemetry is detected.
          </p>
        )}
        {status === 'error' && error && (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        <Button type="submit" disabled={status === 'loading'} className="self-start">
          {status === 'loading' ? 'Registering…' : 'Register Node'}
        </Button>
      </form>
    </Card>
  );
}
