// src/lib/auth/privy.ts
export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  config: {
    loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord'],
    appearance: {
      theme: 'dark' as const,
      accentColor: '#ff6b35',
      logo: '/logo.png',
      showWalletLoginFirst: false,
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets' as const,
    },
    defaultChain: {
      id: 8453,
      name: 'Base',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://mainnet.base.org'] },
        public: { http: ['https://mainnet.base.org'] },
      },
      blockExplorers: {
        default: { name: 'BaseScan', url: 'https://basescan.org' },
      },
    },
    supportedChains: [
      {
        id: 8453,
        name: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://mainnet.base.org'] },
          public: { http: ['https://mainnet.base.org'] },
        },
        blockExplorers: {
          default: { name: 'BaseScan', url: 'https://basescan.org' },
        },
      },
    ],
  },
};
