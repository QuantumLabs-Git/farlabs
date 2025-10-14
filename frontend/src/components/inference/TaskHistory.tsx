'use client';

import { InferenceTask } from '@/lib/api/inference';
import { Card } from '@/components/ui/Card';

interface Props {
  tasks: InferenceTask[];
}

export function TaskHistory({ tasks }: Props) {
  if (!tasks.length) {
    return (
      <Card elevated className="grid place-items-center py-12 text-sm text-white/60">
        No inference tasks yet. Run a prompt to populate your history.
      </Card>
    );
  }

  return (
    <Card elevated className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">Recent Tasks</p>
          <h3 className="text-lg font-semibold text-white">Inference Stream</h3>
        </div>
      </header>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.task_id}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{task.model}</p>
                <p className="font-mono text-xs text-white/40">{task.task_id}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.26em] text-white/60">
                {task.status}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-white/60">{task.prompt}</p>
            {task.result && (
              <div className="mt-3 rounded-xl border border-white/10 bg-[#090909]/60 p-3 text-xs text-white/60">
                {task.result.slice(0, 280)}{task.result.length > 280 ? '…' : ''}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
              <span>{task.tokens_generated ?? task.max_tokens} tokens</span>
              {task.cost !== undefined && <span>{task.cost.toFixed?.(4) ?? task.cost} FAR</span>}
              {task.updated_at && <span>Updated {new Date(task.updated_at).toLocaleString()}</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
