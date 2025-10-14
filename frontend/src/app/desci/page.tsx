import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Beaker, Database, Network, Scan } from 'lucide-react';

const modules = [
  {
    icon: Beaker,
    title: 'DAO Research Grants',
    description:
      'Decentralized grant pools enabling DAO-curated funding with milestone-based payouts.'
  },
  {
    icon: Network,
    title: 'Collaborative Labs',
    description:
      'Secure workspaces combining IPFS storage, versioned experiments, and BSC notarization.'
  },
  {
    icon: Scan,
    title: 'Reproducibility Engine',
    description:
      'Automated reproducibility checks leveraging Far GPU De-Pin compute credits and zero-knowledge attestations.'
  },
  {
    icon: Database,
    title: 'Data Exchange',
    description:
      'Token-gated datasets with on-chain licensing and streaming royalties to contributors.'
  }
];

export default function DesciPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <h1 className="text-4xl font-semibold text-white">Far DeSci Platform</h1>
        <p className="max-w-3xl text-sm text-white/60">
          Empower research communities with programmable funding rails, verifiable data provenance,
          and self-sovereign reputation. Stake $FAR to curate proposals or deploy lab services with
          automated billing.
        </p>
        <Button>Launch DeSci Console (Coming Soon)</Button>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {modules.map((module) => (
          <Card key={module.title} elevated className="space-y-4">
            <module.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="text-xl font-semibold text-white">{module.title}</h3>
            <p className="text-sm text-white/60">{module.description}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
