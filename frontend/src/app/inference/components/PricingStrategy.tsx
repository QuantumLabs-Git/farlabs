"use client";

import { motion } from "framer-motion";
import { Table2, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

const comparisons = [
  { tier: "Small (3B – 7B)", centralized: "$3 – $6", farlabs: "$0.10 – $0.50", savings: "90–95%" },
  { tier: "Medium (8B – 70B)", centralized: "$15 – $30", farlabs: "$1.00 – $3.00", savings: "85–90%" },
  { tier: "Large (70B+)", centralized: "$60 – $150", farlabs: "$5.00 – $15.00", savings: "75–90%" },
  { tier: "Coding Models", centralized: "$20 – $40", farlabs: "$2.00 – $5.00", savings: "75–87%" }
];

const levers = [
  {
    title: "Dynamic utilization pricing",
    description: "Per-model token prices adjust every hour based on GPU supply, task queue depth, and competitor benchmarks.",
  },
  {
    title: "Staking & loyalty discounts",
    description: "Stake FAR for up to 50% price reductions, unlock prepaid bundles, and accumulate referral rebates.",
  },
  {
    title: "Quantization choices",
    description: "Select FP16 / INT8 / INT4 execution for cost reductions up to 60% without switching APIs.",
  },
  {
    title: "Batch & cache aware billing",
    description: "Bulk inference batches receive automatic discounts; repeated prompts leverage a shared cache with 90% cost cuts."
  }
];

const economics = [
  { label: "User payment (Llama 70B at $3)", value: formatCurrency(3) },
  { label: "GPU provider (60%)", value: formatCurrency(1.8), footnote: "Avg. operating cost: ~$0.37" },
  { label: "Token holders (20%)", value: formatCurrency(0.6) },
  { label: "Far Labs platform (20%)", value: formatCurrency(0.6), footnote: "Infrastructure: ~$0.15, Ops: ~$0.20, Margin: ~$0.25" }
];

export function PricingStrategy() {
  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Pricing model with 50–90% savings</h2>
        <p className="max-w-3xl text-sm text-white/60">
          Token-based billing anchored to real GPU economics. Automated price oracles maintain a minimum 50% discount vs OpenAI and Anthropic while rewarding providers and stakers.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        className="rounded-3xl border border-white/10 bg-[#090909]/80 p-6"
      >
        <div className="flex items-center gap-3">
          <Table2 className="h-5 w-5 text-brand-soft" />
          <h3 className="text-lg font-semibold text-white">Market comparison (per 1M tokens)</h3>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-[0.2em]">Segment</th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-[0.2em]">Centralized providers</th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-[0.2em]">$FAR price target</th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-[0.2em]">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white/80">
              {comparisons.map((row) => (
                <tr key={row.tier} className="bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{row.tier}</td>
                  <td className="px-4 py-3">{row.centralized}</td>
                  <td className="px-4 py-3">{row.farlabs}</td>
                  <td className="px-4 py-3 text-brand-soft">{row.savings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {levers.map((lever, index) => (
          <motion.div
            key={lever.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <h3 className="text-base font-semibold text-white">{lever.title}</h3>
            <p className="mt-2 text-sm text-white/65">{lever.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        className="rounded-3xl border border-brand/20 bg-brand/10 p-6"
      >
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-brand-soft" />
          <h3 className="text-lg font-semibold text-white">Unit economics snapshot</h3>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {economics.map((item) => (
            <div key={item.label} className="rounded-2xl bg-[#0B0B0B]/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              {item.footnote && <p className="mt-1 text-xs text-white/60">{item.footnote}</p>}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
