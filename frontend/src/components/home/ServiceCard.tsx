'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface ServiceCardProps {
  service: {
    id: string;
    icon: string;
    title: string;
    description: string;
    href: string;
    gradient: string;
  };
  index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ delay: index * 0.04, duration: 0.5, ease: 'easeOut' }}
      className="group relative"
    >
      <Link href={service.href}>
        <div className="relative overflow-hidden rounded-3xl border border-[#222] bg-[#0F0F0F]/80 p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand hover:shadow-neon">
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-[0.15]`} />
          </div>

          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(124,58,237,0.12), transparent 40%)`
            }}
          />

          <div className="relative z-10 space-y-5">
            <div className="text-5xl grayscale transition-transform duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_18px_rgba(124,58,237,0.55)] group-hover:grayscale-0">
              {service.icon}
            </div>

            <h3 className="text-2xl font-semibold tracking-tight text-white">
              <span className="bg-gradient-to-r from-brand to-brand-soft bg-clip-text text-transparent">
                {service.title}
              </span>
            </h3>

            <p className="text-sm leading-relaxed text-[#CACACA] transition-colors group-hover:text-white/90">
              {service.description}
            </p>

            <div className="flex items-center gap-2 text-sm font-semibold text-brand-soft">
              <span className="transition-transform duration-300 group-hover:translate-x-2">
                Engage →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
