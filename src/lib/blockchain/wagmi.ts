import { configureChains, createConfig } from 'wagmi';
import { base, baseGoerli } from 'viem/chains';
import { publicProvider } from 'wagmi/providers/public';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [base, baseGoerli],
  [publicProvider()]
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
        metadata: {
          name: 'SpreadMarkets',
          description: 'Fantasy Prediction Markets',
          url: process.env.NEXT_PUBLIC_APP_URL!,
          icons: ['/logo.png'],
        },
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

export { chains };
