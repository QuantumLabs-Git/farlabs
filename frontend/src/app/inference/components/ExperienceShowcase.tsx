"use client";

import { motion } from "framer-motion";
import { MonitorSmartphone, Rocket } from "lucide-react";

const experiences = [
  {
    title: "Non-technical users",
    icon: Rocket,
    highlights: [
      "One-click wallet connection with optional MoonPay / Transak on-ramps",
      "Pre-built prompt templates and industry playbooks for rapid experimentation",
      "Real-time cost calculator showing FAR token usage vs USD equivalents",
      "Usage dashboards with streaming responses, saved sessions, and export options"
    ]
  },
  {
    title: "GPU providers",
    icon: MonitorSmartphone,
    highlights: [
      "Docker image with GPU auto-detection & watchdog; Windows/Mac installers under development",
      "Live earnings dashboard in FAR + USD, uptime alerts, and maintenance reminders",
      "Node setup wizard, API key management, and performance tuning recommendations",
      "Notification system for downtime, payouts, and governance proposals"
    ]
  }
];

export function ExperienceShowcase() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Experience layers</h2>
        <p className="max-w-3xl text-sm text-white/60">
          Far Labs balances accessibility with deep control—users launch inference workflows in seconds, while GPU providers manage earnings and performance in real time.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {experiences.map((experience, index) => (
          <motion.div
            key={experience.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <experience.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="mt-4 text-lg font-semibold text-white">{experience.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {experience.highlights.map((item) => (
                <li key={item} className="rounded-2xl bg-[#050505]/70 p-4 leading-relaxed">
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
