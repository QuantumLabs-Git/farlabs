"use client";

import { motion } from "framer-motion";
import { Layers, Server, Workflow } from "lucide-react";

const architecture = [
  {
    icon: Workflow,
    title: "Backend Core",
    items: [
      "FastAPI orchestration layer with async endpoints and WebSocket streaming",
      "Redis + Celery pipeline for payment verification and task queueing",
      "Web3.py integration to InferencePayment & NodeRegistry contracts on BSC",
      "PostgreSQL (users, nodes, billing) & MongoDB (inference logs, telemetry)"
    ]
  },
  {
    icon: Layers,
    title: "Frontend Experience",
    items: [
      "Next.js 14 App Router with TypeScript and shadcn/ui primitives",
      "Zustand stores for inference session state and pricing calculators",
      "wagmi + viem wallet connectivity, Socket.io-client for live updates",
      "Provider dashboards and admin consoles aligned with Far Labs design"
    ]
  },
  {
    icon: Server,
    title: "Infrastructure Footprint",
    items: [
      "AWS ECS Fargate workloads behind an Application Load Balancer",
      "ElastiCache Redis, RDS PostgreSQL, S3 model storage, CloudFront CDN",
      "Route53-managed domains with WAF + Shield for L7/L3 protection",
      "Private VPC network segmentation with security-grouped services"
    ]
  }
];

export function ArchitectureOverview() {
  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          Far Labs inference architecture (Petals powered)
        </h2>
        <p className="max-w-3xl text-sm text-white/60">
          A payment-aware fork of Petals adapted to Web3 settlements, GPU provider incentives, and enterprise-grade observability.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {architecture.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-3xl border border-white/10 bg-[#0B0B0B]/80 p-6"
          >
            <section.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="mt-4 text-lg font-semibold text-white">{section.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              {section.items.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
