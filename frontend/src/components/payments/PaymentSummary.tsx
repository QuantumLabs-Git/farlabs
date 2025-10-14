'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePaymentBalance } from '@/hooks/usePayments';

export function PaymentSummary() {
  const { balance } = usePaymentBalance();

  return (
    <Card elevated className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">Wallet Balance</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {balance ? balance.available.toLocaleString() : '—'} FAR
          </p>
        </div>
        <div className="text-right text-sm text-white/60">
          <p>Escrowed: {balance ? balance.escrowed.toLocaleString() : '—'} FAR</p>
          <p>Total: {balance ? balance.total.toLocaleString() : '—'} FAR</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button size="sm" className="flex-1" disabled>
          Top Up
        </Button>
        <Button size="sm" variant="ghost" className="flex-1" disabled>
          Withdraw
        </Button>
      </div>
      <p className="text-xs text-white/40">
        Payments service emulates FAR token balances for inference settlement. Top-up and withdraw
        endpoints can be wired to UI once funding flows are live.
      </p>
    </Card>
  );
}
