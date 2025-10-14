import { ServiceGrid } from '@/components/home/ServiceGrid';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';

const services = [
  {
    id: 'inference',
    icon: '🧠',
    title: 'Far Inference',
    description: 'Decentralized AI inference network for LLMs and machine learning models',
    href: '/inference',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 'gaming',
    icon: '🎮',
    title: 'Farcana Game',
    description: 'Next-gen blockchain gaming ecosystem with play-to-earn mechanics',
    href: '/gaming',
    gradient: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'desci',
    icon: '🧪',
    title: 'Far DeSci',
    description: 'Decentralized science platform for research collaboration and funding',
    href: '/desci',
    gradient: 'from-green-600 to-teal-600'
  },
  {
    id: 'gamed',
    icon: '🏆',
    title: 'Far GameD',
    description: 'Game distribution platform with blockchain-based licensing',
    href: '/gamed',
    gradient: 'from-orange-600 to-red-600'
  },
  {
    id: 'fartwin',
    icon: '👥',
    title: 'FarTwin AI',
    description: 'Digital twin AI platform for personalized virtual assistants',
    href: '/fartwin',
    gradient: 'from-indigo-600 to-purple-600'
  },
  {
    id: 'gpu',
    icon: '🖥️',
    title: 'Far GPU De-Pin',
    description: 'A DePIN network where users can supply their GPU for training AI models',
    href: '/gpu',
    gradient: 'from-yellow-600 to-orange-600'
  },
  {
    id: 'staking',
    icon: '💎',
    title: '$FAR Staking',
    description: 'The utility token powering the entire Far Labs ecosystem',
    href: '/staking',
    gradient: 'from-purple-600 to-indigo-600'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen space-y-24">
      <HeroSection />
      <StatsSection />
      <ServiceGrid services={services} />
    </main>
  );
}
