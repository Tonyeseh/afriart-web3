"use client";
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter, projectId, networks } from '../config/wagmi';
import { hedera, hederaTestnet } from '@reown/appkit/networks';
import { ReactNode } from 'react';

// Setup QueryClient
const queryClient = new QueryClient();

// Metadata for the DApp
const metadata = {
  name: 'Afriart',
  description: 'Hedera NFT Marketplace for African Art',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://afriart.com',
  icons: ['https://avatars.githubusercontent.com/u/31002956'],
};

// Create the AppKit modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [hederaTestnet, hedera],
  defaultNetwork: hederaTestnet,
  metadata,
  features: {
    analytics: true, // Optional - enable analytics
    email: false, // Optional - disable email login
    socials: [], // Optional - no social logins
    emailShowWallets: true, // Optional - show wallets in email flow
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#8B5CF6', // Purple accent color
    '--w3m-border-radius-master': '2px',
  },
});

interface HederaWalletProviderProps {
  children: ReactNode;
}

/**
 * Hedera Wallet Provider using Reown AppKit
 *
 * This provider wraps the application with the necessary context providers
 * for wallet connectivity using Reown's AppKit framework.
 */
export function HederaWalletProvider({ children }: HederaWalletProviderProps) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default HederaWalletProvider;

// Export the modal for use in components
export { modal };

// Backward compatibility export - use useWallet hook instead
/**
 * @deprecated Use useWallet hook from '../hooks/useWallet' instead
 * This export is provided for backward compatibility only
 */
export function useHederaConnector() {
  console.warn('useHederaConnector is deprecated. Please use useWallet hook from hooks/useWallet instead.');
  // Return a minimal implementation that will work with old code
  return {
    walletConnector: {
      init: async () => {},
      openModal: async () => null,
      signMessage: async () => ({ signatureMap: '' }),
      getAccountId: () => null,
      isConnected: () => false,
      disconnectAll: async () => {},
      on: () => {},
    },
  };
}
