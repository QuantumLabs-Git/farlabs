"use client";

import { motion } from "framer-motion";
import { Activity, Award, TrendingUp } from "lucide-react";

const metrics = [
  {
    icon: Activity,
    label: "Reliability formula",
    description: "Base Score = (Uptime × 0.4) + (Speed × 0.3) + (Accuracy × 0.2) + (Satisfaction × 0.1)."
  },
  {
    icon: TrendingUp,
    label: "Payment modulation",
    description: "Bonus/Penalty = (Base Score − 0.8) × 50%, capped at ±10% and applied on-chain."
  },
  {
    icon: Award,
    label: "Provider incentives",
    description: "High uptime, low latency, off-peak coverage, and long-term commitments earn stacked rewards."
  }
];

const tracker = [
  "Uptime % (30-day rolling)",
  "Latency percentiles (P50/P95/P99)",
  "Tokens per second throughput",
  "Inference accuracy audits",
  "Customer satisfaction pulses"
];

export function ReliabilitySection() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Reliability & rating engine</h2>
        <p className="max-w-3xl text-sm text-white/60">
          Every GPU node is continuously evaluated by the Far Labs rating oracle. Scores feed payment adjustments, marketplace visibility, and staking rewards.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-3xl border border-white/10 bg-[#0A0A0A]/80 p-6"
          >
            <metric.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="mt-4 text-base font-semibold text-white">{metric.label}</h3>
            <p className="mt-2 text-sm text-white/65">{metric.description}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Telemetry tracked</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-white/70">
          {tracker.map((item) => (
            <li key={item} className="rounded-2xl bg-[#050505]/70 p-4">{item}</li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
