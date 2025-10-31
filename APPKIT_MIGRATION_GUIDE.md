# Reown AppKit Migration Guide

## Overview

This document describes the migration from `@hashgraph/hedera-wallet-connect` to Reown's AppKit for wallet connectivity in the AfriArt NFT Marketplace.

## What Changed

### 1. Dependencies

**Old Dependencies:**
```json
{
  "@hashgraph/hedera-wallet-connect": "^1.5.1",
  "@walletconnect/modal": "^2.7.0"
}
```

**New Dependencies:**
```json
{
  "@reown/appkit": "^1.8.12",
  "@reown/appkit-adapter-wagmi": "^1.8.12",
  "@tanstack/react-query": "^5.90.5",
  "viem": "^2.38.5",
  "wagmi": "^2.19.1",
  "@wagmi/core": "^2.22.1"
}
```

### 2. File Structure

**New Files:**
- `frontend/config/wagmi.ts` - Wagmi adapter configuration for Hedera
- `frontend/hooks/useWallet.ts` - Custom hook for wallet operations
- `frontend/contexts/WalletProvider.tsx` - Updated to use Reown AppKit
- `frontend/contexts/AuthContext.tsx` - Updated to use new wallet hook

## Installation

```bash
cd frontend
pnpm add @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query @wagmi/core
```

## Configuration

### 1. Wagmi Configuration (`config/wagmi.ts`)

```typescript
import { cookieStorage, createStorage, http } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { hedera, hederaTestnet } from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

export const networks = [hederaTestnet, hedera] as const;

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
```

### 2. Wallet Provider (`contexts/WalletProvider.tsx`)

```typescript
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter, projectId } from '../config/wagmi';
import { hedera, hederaTestnet } from '@reown/appkit/networks';

const queryClient = new QueryClient();

const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [hederaTestnet, hedera],
  defaultNetwork: hederaTestnet,
  metadata: {
    name: 'Afriart',
    description: 'Hedera NFT Marketplace for African Art',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://afriart.com',
    icons: ['https://avatars.githubusercontent.com/u/31002956'],
  },
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  themeMode: 'light',
});

export function HederaWalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { modal };
```

### 3. Custom Wallet Hook (`hooks/useWallet.ts`)

```typescript
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useSignMessage, useDisconnect } from 'wagmi';

export function useWallet() {
  const { open, close } = useAppKit();
  const { address, isConnected, caipAddress } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const connect = async () => await open();
  const disconnectWallet = () => {
    disconnect();
    close();
  };

  const signMessage = async (message: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }
    return await signMessageAsync({ message });
  };

  const getAccountId = (): string | null => {
    if (!caipAddress) return null;
    const parts = caipAddress.split(':');
    return parts.length >= 3 ? parts[2] : null;
  };

  return {
    address,
    isConnected,
    caipAddress,
    accountId: getAccountId(),
    connect,
    disconnect: disconnectWallet,
    signMessage,
    openModal: open,
    closeModal: close,
  };
}
```

## Migration Steps

### Step 1: Install Dependencies

```bash
cd frontend
pnpm add @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query @wagmi/core
```

### Step 2: Create Configuration Files

Create `frontend/config/wagmi.ts` with the Wagmi adapter configuration.

### Step 3: Update WalletProvider

Replace the contents of `frontend/contexts/WalletProvider.tsx` with the new AppKit implementation.

### Step 4: Create useWallet Hook

Create `frontend/hooks/useWallet.ts` with the custom wallet hook.

### Step 5: Update AuthContext

Update `frontend/contexts/AuthContext.tsx` to use the new `useWallet` hook instead of `useHederaConnector`.

**Old:**
```typescript
import { useHederaConnector } from './WalletProvider';

const { walletConnector } = useHederaConnector();
await walletConnector.init();
const session = await walletConnector.openModal();
```

**New:**
```typescript
import { useWallet } from '../hooks/useWallet';

const wallet = useWallet();
if (!wallet.isConnected) {
  await wallet.connect();
}
const walletAddress = wallet.accountId;
```

### Step 6: Update Components

Update any components that directly use wallet functionality:

**Old:**
```typescript
import { useHederaConnector } from '../../contexts/WalletProvider';

const { walletConnector } = useHederaConnector();
```

**New:**
```typescript
import { useWallet } from '../../hooks/useWallet';

const { connect, disconnect, isConnected, accountId } = useWallet();
```

## Key Differences

### Connection Flow

**Old Flow:**
1. Call `walletConnector.init()`
2. Call `walletConnector.openModal()`
3. Extract session and account info manually

**New Flow:**
1. Call `wallet.connect()` (handles both init and modal)
2. Access `wallet.accountId` directly
3. Check `wallet.isConnected` for status

### Message Signing

**Old:**
```typescript
const result = await walletConnector.signMessage({
  message: message,
  signerAccountId: account
});
const signatureMap = result.signatureMap;
```

**New:**
```typescript
const signature = await wallet.signMessage(message);
// signature is the string directly
```

### Account ID Format

**Both versions return the same format:** `"0.0.12345"`

The new implementation extracts it from the CAIP-10 format (`"hedera:testnet:0.0.12345"`) automatically.

## Benefits of the Migration

### 1. Better Developer Experience
- Cleaner API with intuitive method names
- Type-safe with excellent TypeScript support
- Automatic session management

### 2. Enhanced Features
- Built-in analytics support
- Better error handling
- Automatic reconnection
- Network switching UI

### 3. Modern Architecture
- Uses latest Wagmi patterns
- React Query for state management
- Cookie-based session storage (SSR-friendly)

### 4. Future-Proof
- Active development by Reown
- Regular updates and security patches
- Growing ecosystem support

## Troubleshooting

### Issue: "Cannot find module '@wagmi/core'"

**Solution:**
```bash
pnpm add @wagmi/core
```

### Issue: "Project ID is not defined"

**Solution:**
1. Get a project ID from [Reown Cloud](https://cloud.reown.com)
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   ```

### Issue: Wallet not connecting

**Solution:**
1. Check that you're using a supported wallet (HashPack, Blade)
2. Ensure the wallet is on the same network (testnet/mainnet)
3. Check browser console for errors
4. Try clearing cookies and reconnecting

### Issue: Signature verification fails

**Solution:**
The signature format is different. The old implementation returned a `signatureMap` object, while the new one returns a signature string directly. Update your backend to handle both formats during the transition.

## Backward Compatibility

The `useHederaConnector` export is still available in `WalletProvider.tsx` for backward compatibility, but it's deprecated and should not be used for new code. It will log a warning when used.

## Testing

After migration, test the following workflows:

1. **Wallet Connection**
   - [ ] Connect wallet via AppKit modal
   - [ ] Verify account ID is displayed correctly
   - [ ] Check session persistence across page refreshes

2. **Authentication**
   - [ ] Sign authentication message
   - [ ] Verify signature on backend
   - [ ] Receive and store JWT token

3. **Disconnect**
   - [ ] Disconnect wallet
   - [ ] Verify session is cleared
   - [ ] Check localStorage is cleaned up

4. **Network Switching**
   - [ ] Switch between testnet and mainnet
   - [ ] Verify account updates correctly

## Support

For issues or questions about the migration:

1. Check the [Reown Documentation](https://docs.reown.com)
2. Review the [Wagmi Documentation](https://wagmi.sh)
3. Open an issue in the project repository

## Migration Checklist

- [ ] Install new dependencies
- [ ] Create `config/wagmi.ts`
- [ ] Update `contexts/WalletProvider.tsx`
- [ ] Create `hooks/useWallet.ts`
- [ ] Update `contexts/AuthContext.tsx`
- [ ] Update any components using wallet functionality
- [ ] Update environment variables
- [ ] Test wallet connection
- [ ] Test authentication flow
- [ ] Test disconnect functionality
- [ ] Update documentation

---

**Migration completed on:** 2025-10-29
**AppKit version:** 1.8.12
**Wagmi version:** 2.19.1
