"use client";

import { ServiceCard } from '@/components/home/ServiceCard';
import { motion } from 'framer-motion';

interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  gradient: string;
}

interface ServiceGridProps {
  services: Service[];
}

export function ServiceGrid({ services }: ServiceGridProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          className="text-sm font-medium uppercase tracking-[0.35em] text-brand-soft/70"
        >
          The Far Labs Stack
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.08 }}
          className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
        >
          Six synergistic products, one unified token economy.
        </motion.h2>
      </div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {services.map((service, index) => (
          <ServiceCard key={service.id} service={service} index={index} />
        ))}
      </motion.div>
    </section>
  );
}
