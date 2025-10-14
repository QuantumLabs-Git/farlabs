import { http, cookieStorage, createStorage } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { createConfig } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const defaultChain = bsc;
const defaultRpc = process.env.NEXT_PUBLIC_BSC_RPC ?? defaultChain.rpcUrls.default.http[0]!;

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
  chains: [defaultChain],
  connectors,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [defaultChain.id]: http(defaultRpc)
  }
});
