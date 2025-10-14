'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Book, Network, Cpu, ArrowRight, Code, Zap, Shield } from 'lucide-react';

export default function DocsPage() {
  const docSections = [
    {
      title: 'Far Mono',
      description: 'Single-node inference with GPU acceleration. Perfect for dedicated workloads requiring maximum performance.',
      icon: Cpu,
      href: '/docs/far-mono',
      features: ['Single GPU node', 'High throughput', 'Low latency', 'Full GPU control'],
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Far Mesh',
      description: 'Distributed inference across multiple nodes. Scalable, fault-tolerant, and cost-effective.',
      icon: Network,
      href: '/docs/far-mesh',
      features: ['Multi-node processing', 'Automatic failover', 'Dynamic scaling', 'Token-based payments'],
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  const quickLinks = [
    { title: 'API Reference', href: '/docs/api', icon: Code },
    { title: 'Getting Started', href: '/docs/getting-started', icon: Zap },
    { title: 'Security', href: '/docs/security', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <Book className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Documentation</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Far Labs Inference Platform
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Choose between single-node power or distributed scalability. Both inference types are powered by the $FAR token economy.
          </p>
        </motion.div>

        {/* Main Documentation Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {docSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={section.href}>
                <div className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-gray-600 transition-all duration-300 h-full">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${section.gradient} mb-6`}>
                    <section.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                    {section.title}
                    <ArrowRight className="w-6 h-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </h2>

                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {section.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3">
                    {section.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${section.gradient}`} />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Read More */}
                  <div className="mt-6 pt-6 border-t border-gray-700/50">
                    <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                      Read full documentation →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-gray-800/30 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-white mb-6">Quick Links</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.title} href={link.href}>
                <div className="flex items-center gap-3 p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors group">
                  <link.icon className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                    {link.title}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Quick Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-400 font-medium">Feature</th>
                  <th className="text-center p-4 text-blue-400 font-medium">Far Mono</th>
                  <th className="text-center p-4 text-purple-400 font-medium">Far Mesh</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="p-4">Architecture</td>
                  <td className="p-4 text-center">Single GPU node</td>
                  <td className="p-4 text-center">Distributed mesh</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-4">Best for</td>
                  <td className="p-4 text-center">Dedicated workloads</td>
                  <td className="p-4 text-center">Variable demand</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-4">Fault tolerance</td>
                  <td className="p-4 text-center">Single point of failure</td>
                  <td className="p-4 text-center">Automatic failover</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-4">Scaling</td>
                  <td className="p-4 text-center">Vertical (GPU upgrade)</td>
                  <td className="p-4 text-center">Horizontal (add nodes)</td>
                </tr>
                <tr className="border-b border-gray-800">
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
        </motion.div>
      </div>
    </div>
  );
}
