"use client";

import { InferencePlayground } from '@/components/inference/InferencePlayground';
import { TaskHistory } from '@/components/inference/TaskHistory';
import { useInferenceTasks } from '@/hooks/useInferenceTasks';

export default function InferencePlaygroundPage() {
  const { tasks, refresh } = useInferenceTasks();

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold text-white">Inference Playground</h1>
        <p className="text-sm text-white/60">
          Prototype prompts and benchmark performance prior to production deployment. Results stream directly into your mission control dashboard.
        </p>
      </header>

      <InferencePlayground onCompleted={refresh} />

      <TaskHistory tasks={tasks} />
    </div>
  );
}
