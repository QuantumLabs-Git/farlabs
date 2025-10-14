"use client";

import useSWR from 'swr';
import { WalletConnect } from '@/components/web3/WalletConnect';
import { TokenBalance } from '@/components/web3/TokenBalance';
import { TransactionHistory } from '@/components/web3/TransactionHistory';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { RevenueCalculator } from '@/components/revenue/RevenueCalculator';
import { TaskHistory } from '@/components/inference/TaskHistory';
import { GpuNodesTable } from '@/components/gpu/GpuNodesTable';
import { PaymentSummary } from '@/components/payments/PaymentSummary';
import { StakingOverview } from '@/components/staking/StakingOverview';
import { useInferenceTasks } from '@/hooks/useInferenceTasks';
import { useWeb3 } from '@/hooks/useWeb3';
import { useRevenueProjections } from '@/hooks/useRevenue';
import { fetchOwnerNodes, GpuNode } from '@/lib/api/gpu';

export default function DashboardPage() {
  const { tasks } = useInferenceTasks();
  const { address } = useWeb3();
  const { data: ownerNodes } = useSWR<GpuNode[]>(
    address ? ['gpu-owner-nodes', address] : null,
    () => fetchOwnerNodes(address!)
  );
  const { projections, isLoading: revenueLoading } = useRevenueProjections();

  return (
    <div className="space-y-16">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold text-white">Mission Control</h1>
          <p className="max-w-2xl text-sm text-white/60">
            Manage wallet connectivity, monitor treasury performance, and run revenue forecasts for
            every Far Labs vertical.
          </p>
        </div>
        <WalletConnect />
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <PaymentSummary />
        </div>
        <TokenBalance />
        <div className="lg:col-span-2">
          <RevenueChart data={projections} isLoading={revenueLoading} />
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <RevenueCalculator />
        <StakingOverview />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TaskHistory tasks={tasks} />
        <GpuNodesTable nodes={ownerNodes ?? []} />
      </section>

      <TransactionHistory />
    </div>
  );
}
