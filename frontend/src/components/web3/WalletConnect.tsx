'use client';

import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useDisconnect } from 'wagmi';
import { shortenAddress } from '@/lib/utils/formatters';
import { loginWithWallet } from '@/lib/api/auth';
import { ChevronDown, Wallet as WalletIcon } from 'lucide-react';

function useConnectorName(connectorName: string): string {
  if (connectorName.toLowerCase().includes('injected')) return 'Browser Wallet';
  return connectorName;
}

export function WalletConnect() {
  const { isConnected, connect, connectors, pendingConnector, address, formattedBalance } = useWeb3();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isConnected || !address) {
      window.localStorage.removeItem('farlabs.jwt');
      window.localStorage.removeItem('farlabs.address');
      return;
    }

    const normalized = address.toLowerCase();
    const storedAddress = window.localStorage.getItem('farlabs.address');
    const storedToken = window.localStorage.getItem('farlabs.jwt');
    if (storedAddress === normalized && storedToken) {
      return;
    }

    (async () => {
      try {
        const response = await loginWithWallet(normalized);
        window.localStorage.setItem('farlabs.jwt', response.token);
        window.localStorage.setItem('farlabs.address', normalized);
        window.dispatchEvent(new CustomEvent('farlabs-auth', { detail: { wallet: normalized } }));
      } catch (error) {
        console.error('Failed to login wallet', error);
      }
    })();
  }, [isConnected, address]);

  const handleDisconnect = async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('farlabs.jwt');
      window.localStorage.removeItem('farlabs.address');
    }
    await disconnect();
    setOpen(false);
  };

  if (!isConnected) {
    return (
      <div className="relative inline-flex">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setOpen((prev) => !prev)}
        >
          <WalletIcon className="h-4 w-4" />
          Connect
          <ChevronDown className="h-4 w-4 transition-transform" />
        </Button>
        {open && (
          <div className="absolute right-0 top-[110%] min-w-[12rem] space-y-2 rounded-2xl border border-white/10 bg-[#101010]/95 p-3 shadow-neon backdrop-blur-xl">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                disabled={false}
                onClick={() => {
                  connect({ connector });
                  setOpen(false);
                }}
              >
                {useConnectorName(connector.name)}
                {pendingConnector?.id === connector.id && '…'}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <WalletIcon className="h-4 w-4" />
        {shortenAddress(address)}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
          {formattedBalance} FAR
        </span>
        <ChevronDown className="h-4 w-4 transition-transform" />
      </Button>
      {open && (
        <div className="absolute right-0 top-[110%] w-56 rounded-2xl border border-white/10 bg-[#101010]/90 p-3 shadow-neon backdrop-blur-xl">
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
              <span className="text-xs uppercase tracking-[0.24em] text-white/50">Wallet</span>
              <span className="font-mono text-xs">{shortenAddress(address)}</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
