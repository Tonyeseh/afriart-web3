import { cookieStorage, createStorage, http } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { hedera, hederaTestnet } from '@reown/appkit/networks';

// Get projectId from Reown Cloud: https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set. Please get a project ID from https://cloud.reown.com');
}

// Define the networks
export const networks = [hederaTestnet, hedera];

// Create Wagmi Adapter for Hedera
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
