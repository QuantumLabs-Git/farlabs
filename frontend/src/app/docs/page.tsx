'use client';

import React from 'react';
import Link from 'next/link';
import { Book, Network, Cpu, ArrowRight, Code, Zap, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function DocsPage() {
  const docSections = [
    {
      title: 'Far Mono',
      description: 'Single-node inference with GPU acceleration. Perfect for dedicated workloads requiring maximum performance.',
      icon: Cpu,
      href: '/docs/far-mono',
      features: ['Single GPU node', 'High throughput', 'Low latency', 'Full GPU control'],
      accentColor: 'brand'
    },
    {
      title: 'Far Mesh',
      description: 'Distributed inference across multiple nodes. Scalable, fault-tolerant, and cost-effective.',
      icon: Network,
      href: '/docs/far-mesh',
      features: ['Multi-node processing', 'Automatic failover', 'Dynamic scaling', 'Token-based payments'],
      accentColor: 'brand-soft'
    }
  ];

  const quickLinks = [
    { title: 'API Reference', href: '/docs/api', icon: Code },
    { title: 'Getting Started', href: '/docs/getting-started', icon: Zap },
    { title: 'Security', href: '/docs/security', icon: Shield }
  ];

  return (
    <div className="min-h-screen space-y-16">
      {/* Hero Section */}
      <div className="space-y-12 pt-8">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-2">
            <Book className="w-4 h-4 text-brand-soft" />
            <span className="text-brand-soft text-sm font-medium">Documentation</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Far Labs Inference Platform
          </h1>

          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Choose between single-node power or distributed scalability. Both inference types are powered by the $FAR token economy.
          </p>
        </div>

        {/* Main Documentation Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {docSections.map((section) => (
            <Link key={section.title} href={section.href}>
              <Card elevated className="group h-full space-y-6">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/20 border border-brand/30`}>
                  <section.icon className="w-8 h-8 text-brand-soft" />
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    {section.title}
                    <ArrowRight className="w-6 h-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-brand-soft" />
                  </h2>

                  <p className="text-white/60 leading-relaxed">
                    {section.description}
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3">
                  {section.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-soft" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Read More */}
                <div className="pt-6 border-t border-white/5">
                  <span className="text-sm font-medium text-brand-soft group-hover:text-brand transition-colors">
                    Read full documentation →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <Card elevated className="space-y-6">
          <h3 className="text-2xl font-bold text-white">Quick Links</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.title} href={link.href}>
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-brand/10 hover:border-brand/20 transition-all group">
                  <link.icon className="w-5 h-5 text-brand-soft" />
                  <span className="text-white font-medium group-hover:text-brand-soft transition-colors">
                    {link.title}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-auto text-white/40 group-hover:text-brand-soft group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Comparison Table */}
        <div className="space-y-8">
          <h3 className="text-3xl font-bold text-white text-center">Quick Comparison</h3>
          <Card elevated>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-white/60 font-medium">Feature</th>
                    <th className="text-center p-4 text-brand-soft font-medium">Far Mono</th>
                    <th className="text-center p-4 text-brand-accent font-medium">Far Mesh</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-white/5">
                    <td className="p-4">Architecture</td>
                    <td className="p-4 text-center">Single GPU node</td>
                    <td className="p-4 text-center">Distributed mesh</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Best for</td>
                    <td className="p-4 text-center">Dedicated workloads</td>
                    <td className="p-4 text-center">Variable demand</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Fault tolerance</td>
                    <td className="p-4 text-center">Single point of failure</td>
                    <td className="p-4 text-center">Automatic failover</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Scaling</td>
                    <td className="p-4 text-center">Vertical (GPU upgrade)</td>
                    <td className="p-4 text-center">Horizontal (add nodes)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Latency</td>
                    <td className="p-4 text-center">Ultra-low (~50-100ms)</td>
                    <td className="p-4 text-center">Low (~100-300ms)</td>
                  </tr>
                  <tr>
                    <td className="p-4">Payment model</td>
                    <td className="p-4 text-center">$FAR tokens per request</td>
                    <td className="p-4 text-center">$FAR tokens per chunk</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
