import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Brain, UserCircle, Wand2 } from 'lucide-react';

const personas = [
  {
    type: 'Creator',
    description:
      'Launch branded AI personas that monetize through conversational commerce and gated content.'
  },
  {
    type: 'Enterprise',
    description:
      'Deploy internal knowledge twins syncing with Confluence, Notion, and Git repositories.'
  },
  {
    type: 'Gaming',
    description: 'Spin up NPC twins with token-gated loadouts and dynamic storytelling.'
  }
];

export default function FarTwinPage() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-white">FarTwin AI Agents</h1>
          <p className="text-sm text-white/60">
            Compose digital twins that blend knowledge retrieval, real-time inference, and Web3
            payments. Configure token incentives for community-built agents.
          </p>
          <div className="flex gap-4">
            <Link href="/fartwin/studio">
              <Button>Open Studio</Button>
            </Link>
            <Link href="/docs/fartwin">
              <Button variant="ghost">SDK Docs</Button>
            </Link>
          </div>
        </div>
        <Card elevated className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Persona Types</p>
          <div className="space-y-4">
            {personas.map((persona) => (
              <div key={persona.type}>
                <p className="text-sm font-semibold text-white">{persona.type}</p>
                <p className="text-sm text-white/60">{persona.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Brain,
            title: 'Knowledge Graphs',
            description: 'Vector-augmented context windows backed by DynamoDB streams.'
          },
          {
            icon: UserCircle,
            title: 'Identity Anchors',
            description: 'Link DID credentials to on-chain identity and gated experiences.'
          },
          {
            icon: Wand2,
            title: 'Autonomous Actions',
            description: 'Trigger workflows through safe contracts with guardian approvals.'
          }
        ].map((feature) => (
          <Card key={feature.title} elevated className="space-y-4">
            <feature.icon className="h-6 w-6 text-brand-soft" />
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="text-sm text-white/60">{feature.description}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
