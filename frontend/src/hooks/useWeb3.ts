import { useMemo } from 'react';
import { useAccount, useBalance, useConnect } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/web3/contracts';

export function useWeb3() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, pendingConnector } = useConnect();
  const { data: farBalance } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.FAR_TOKEN as `0x${string}`,
    watch: true,
    enabled: Boolean(address)
  });

  const formattedBalance = useMemo(() => {
    if (!farBalance) return '0';
    return Number.parseFloat(formatEther(farBalance.value as bigint)).toLocaleString(undefined, {
      maximumFractionDigits: 4
    });
  }, [farBalance]);

  return {
    address,
    isConnected,
    connectors,
    connect,
    pendingConnector,
    formattedBalance,
    balanceLoading: !farBalance
  };
}
