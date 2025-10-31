'use client';

import { FormEvent, useState } from 'react';
import { runInference, InferencePayload } from '@/lib/api/inference';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
  onCompleted?: () => void;
}

const AVAILABLE_MODELS: Array<{ id: string; label: string; description: string }> = [
  {
    id: 'distilgpt2',
    label: 'DistilGPT-2',
    description: 'Smallest and fastest. Perfect for testing and simple tasks.'
  },
  {
    id: 'gpt2',
    label: 'GPT-2',
    description: 'Small, fast text generation. Great for prototyping.'
  },
  {
    id: 'gpt2-medium',
    label: 'GPT-2 Medium',
    description: 'Medium-sized model with better quality output.'
  },
  {
    id: 'tinyllama',
    label: 'TinyLlama 1.1B Chat',
    description: 'Chat-optimized small model. Fast and efficient.'
  },
  {
    id: 'phi-2',
    label: 'Microsoft Phi-2',
    description: 'High-quality 2.7B parameter model. Excellent reasoning.'
  },
  {
    id: 'llama-7b',
    label: 'Llama 2 7B Chat',
    description: 'Production-quality chat model. Balanced speed and capability.'
  },
  {
    id: 'llama-70b',
    label: 'Llama 2 70B Chat',
    description: 'Large model with strong capabilities (requires 140GB VRAM).'
  },
  {
    id: 'mixtral-8x22b',
    label: 'Mixtral 8x22B Instruct',
    description: 'Mixture of experts model (requires 180GB VRAM).'
  },
  {
    id: 'llama-405b',
    label: 'Llama 3.1 405B',
    description: 'Flagship model for enterprise (requires 810GB VRAM).'
  }
];

export function InferencePlayground({ onCompleted }: Props) {
  const [payload, setPayload] = useState<InferencePayload>({
    model_id: AVAILABLE_MODELS[0]?.id ?? 'gpt2',
    prompt: '',
    max_tokens: 800,
    temperature: 0.7
  });
  const [status, setStatus] = useState<'idle' | 'running' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);

  const handleChange = <K extends keyof InferencePayload>(key: K) => (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    setPayload((prev) => ({
      ...prev,
      [key]: key === 'max_tokens' || key === 'temperature' ? Number(value) : value
    }));
  };

  const handleModelChange = (event: FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    setPayload((prev) => ({ ...prev, model_id: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!payload.prompt.trim()) {
      setError('Provide a prompt before running inference.');
      return;
    }
    setStatus('running');
    setError(null);
    setOutput('');
    setTokensUsed(null);
    setCost(null);
    try {
      const response = await runInference(payload);
      setOutput(response.result);
      setTokensUsed(response.tokens_used);
      setCost(response.cost);
      setStatus('success');
      onCompleted?.();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to run inference');
    }
  };

  return (
    <Card elevated className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">Prompt Builder</p>
          <h2 className="text-2xl font-semibold text-white">Run a live inference</h2>
          <p className="text-sm text-white/60">
            Dispatch a request to the Far GPU mesh. Tokens and settlement data will stream into your mission dashboard.
          </p>
        </header>

        <label className="space-y-2 text-sm text-white/70">
          <span>Model</span>
          <select
            value={payload.model_id}
            onChange={handleModelChange}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id} className="bg-[#050505] text-white">
                {model.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-white/40">
            {AVAILABLE_MODELS.find((model) => model.id === payload.model_id)?.description}
          </p>
        </label>

        <label className="space-y-2 text-sm text-white/70">
          <span>Prompt</span>
          <textarea
            required
            value={payload.prompt}
            onChange={handleChange('prompt')}
            rows={8}
            placeholder="Explain the Far Labs compute mesh in three bullet points."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-white/70">
            <span>Max Tokens</span>
            <input
              type="number"
              min={64}
              max={4096}
              value={payload.max_tokens}
              onChange={handleChange('max_tokens')}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>Temperature</span>
            <input
              type="number"
              step={0.1}
              min={0}
              max={1.5}
              value={payload.temperature}
              onChange={handleChange('temperature')}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-brand"
            />
          </label>
        </div>

        {status === 'error' && error && (
          <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        <Button type="submit" disabled={status === 'running'} className="self-start">
          {status === 'running' ? 'Streaming tokens…' : 'Generate'}
        </Button>
      </form>

      <div className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-white/40">
          <span>Output</span>
          {tokensUsed !== null && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
              {tokensUsed} tokens · {cost?.toFixed?.(4) ?? cost} FAR
            </span>
          )}
        </div>
        <div className="h-full overflow-auto rounded-2xl border border-white/10 bg-[#090909]/60 p-4 text-sm text-white/70 shadow-inner">
          {status === 'running' && <p className="animate-pulse text-white/50">Executing on Far Mesh…</p>}
          {status !== 'running' && output && <pre className="whitespace-pre-wrap font-sans text-sm text-white/80">{output}</pre>}
          {status !== 'running' && !output && <p className="text-white/40">Run a prompt to see the response here.</p>}
        </div>
      </div>
    </Card>
  );
}
