import { http, cookieStorage, createStorage } from 'wagmi';
import { bsc, mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { createConfig } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Support multiple chains for better wallet compatibility
const supportedChains = [mainnet, bsc, polygon, arbitrum, optimism, base] as const;
const defaultChain = mainnet; // Changed to Ethereum mainnet as most users default to this
const bscRpc = process.env.NEXT_PUBLIC_BSC_RPC ?? bsc.rpcUrls.default.http[0]!;

// Build connectors array conditionally based on available config
const connectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({
    appName: 'Far Labs',
    preference: 'smartWalletOnly'
  })
];

// Only add WalletConnect if we have a valid project ID
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (walletConnectProjectId && walletConnectProjectId.length > 10) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: {
        name: 'Far Labs',
        description: 'Far Labs GPU DePIN Platform',
        url: 'https://app.farlabs.ai',
        icons: ['https://app.farlabs.ai/icon.png']
      }
    })
  );
}

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(bscRpc),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http()
  }
});
