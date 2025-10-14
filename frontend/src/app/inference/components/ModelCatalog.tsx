"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, Code, Globe2 } from "lucide-react";

interface ModelGroup {
  title: string;
  subtitle: string;
  icon: typeof BookOpenCheck;
  models: Array<{
    name: string;
    size: string;
    strengths: string;
    target: string;
  }>;
}

const groups: ModelGroup[] = [
  {
    title: "Priority 1 · Flagship + essential models",
    subtitle: "Available day one for production workloads",
    icon: BookOpenCheck,
    models: [
      { name: "Llama 3.1 405B Instruct", size: "405B", strengths: "General reasoning, complex planning", target: "Enterprise reasoning" },
      { name: "Llama 3.1 70B Instruct", size: "70B", strengths: "Balanced accuracy vs cost", target: "General-purpose chat" },
      { name: "Llama 3.2 11B Vision", size: "11B", strengths: "Multimodal input (text+vision)", target: "Creative & analysis" },
      { name: "Mixtral 8x22B", size: "MoE 176B", strengths: "Speed-focused mixture-of-experts", target: "Low-latency inference" },
      { name: "Mistral Large 2 (123B)", size: "123B", strengths: "High-quality generation", target: "Premium workloads" },
      { name: "Gemma 2 27B Instruct", size: "27B", strengths: "Efficient google-backed model", target: "Cost-sensitive teams" }
    ]
  },
  {
    title: "Priority 2 · Specialized networks",
    subtitle: "Optimised for niche and extended contexts",
    icon: Code,
    models: [
      { name: "DeepSeek Coder V2 236B", size: "236B", strengths: "Best open-source coding experience", target: "Software engineering" },
      { name: "Qwen 2.5 72B Instruct", size: "72B", strengths: "Multilingual + reasoning", target: "Global deployments" },
      { name: "Yi-34B-200K", size: "34B", strengths: "200k context window", target: "Document processing" },
      { name: "BioMistral 7B", size: "7B", strengths: "Biomedical domain knowledge", target: "Healthcare research" },
      { name: "StarCoder2 15B", size: "15B", strengths: "Code completion", target: "Developer tools" }
    ]
  },
  {
    title: "Priority 3 · Community-voted additions",
    subtitle: "Roadmap driven by DAO governance and demand",
    icon: Globe2,
    models: [
      { name: "Falcon 180B", size: "180B", strengths: "Wide adoption, robust open license", target: "AI labs" },
      { name: "Vicuna 33B", size: "33B", strengths: "Fine-tuned on high-quality instruction data", target: "Conversational AI" },
      { name: "Nous-Hermes 2 Mixtral", size: "MoE", strengths: "Long context reasoning", target: "Analysts" },
      { name: "Aya 23 35B", size: "35B", strengths: "23 supported languages", target: "Localization" }
    ]
  }
];

export function ModelCatalog() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Supported open models (Far Labs curated)</h2>
        <p className="max-w-3xl text-sm text-white/60">
          A living registry of LLMs optimized for decentralized serving. Deploy any model via the Far Labs control panel or request community additions.
        </p>
      </div>
      <div className="space-y-6">
        {groups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: groupIndex * 0.08 }}
            className="rounded-3xl border border-white/10 bg-[#050505]/80 p-6"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <group.icon className="h-5 w-5 text-brand-soft" />
                <h3 className="text-lg font-semibold text-white">{group.title}</h3>
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">{group.subtitle}</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.models.map((model) => (
                <div key={model.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{model.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">{model.size}</p>
                  <p className="mt-2 text-sm text-white/70">{model.strengths}</p>
                  <p className="mt-3 text-xs text-brand-soft">Ideal for: {model.target}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
