# Wallet Integration Migration - AppKit Pattern

## Overview

The wallet integration has been migrated to use Reown's AppKit architectural pattern while maintaining compatibility with `@hashgraph/hedera-wallet-connect` v1.5.1.

## What Changed

### 1. **Enhanced WalletProvider** ([contexts/WalletProvider.tsx](frontend/contexts/WalletProvider.tsx))

The `WalletProvider` now implements an AppKit-style API with the following improvements:

#### New `HederaAppKitConnector` Class

A wrapper class that provides a cleaner, more intuitive API:

```typescript
class HederaAppKitConnector {
  // Initialize the connector (must be called before use)
  async init(): Promise<void>

  // Open wallet connection modal
  async openModal(): Promise<SessionStruct | null>

  // Sign a message with connected wallet
  async signMessage(params: { message: string; signerAccountId: string }): Promise<{ signatureMap: string }>

  // Get current session
  getSession(): SessionStruct | null

  // Get connected account ID
  getAccountId(): string | null

  // Check if wallet is connected
  isConnected(): boolean

  // Disconnect all sessions
  async disconnectAll(): Promise<void>

  // Subscribe to session events
  on(event: HederaSessionEvent, callback: (data: any) => void): void
}
```

#### Enhanced Provider Context

The provider now exports additional convenience properties and methods:

```typescript
interface WalletProviderContext {
  walletConnector: HederaAppKitConnector;  // The connector instance
  isConnected: boolean;                     // Connection status
  accountId: string | null;                 // Currently connected account
  connect: () => Promise<void>;             // Connect wallet shortcut
  disconnect: () => Promise<void>;          // Disconnect wallet shortcut
}
```

### 2. **Key Features**

#### Session Management
- Automatic session restoration on page reload
- Session state tracking with React hooks
- Proper cleanup on disconnect

#### Improved Error Handling
- Clear error messages for common issues
- Graceful fallbacks for missing sessions
- Type-safe response handling

#### AppKit-Style API
- Follows Reown's AppKit design patterns
- Intuitive method names and signatures
- Promise-based asynchronous operations
- Event subscription support (placeholder for future use)

## Usage

### Basic Connection Flow

```typescript
import { useHederaConnector } from '@/contexts/WalletProvider';

function MyComponent() {
  const { connect, disconnect, isConnected, accountId } = useHederaConnector();

  const handleConnect = async () => {
    try {
      await connect();
      console.log('Connected!', accountId);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {accountId}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Advanced Usage with Connector

```typescript
import { useHederaConnector } from '@/contexts/WalletProvider';

function SignMessageComponent() {
  const { walletConnector, accountId } = useHederaConnector();

  const signMessage = async () => {
    if (!accountId) return;

    try {
      const result = await walletConnector.signMessage({
        message: 'Hello, Hedera!',
        signerAccountId: `hedera:testnet:${accountId}`
      });

      console.log('Signature:', result.signatureMap);
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  return <button onClick={signMessage}>Sign Message</button>;
}
```

## Migration Benefits

### 1. **Better Developer Experience**
- Cleaner API surface
- More intuitive method names
- Better TypeScript support

### 2. **Improved Reliability**
- Automatic session restoration
- Better error handling
- Type-safe operations

### 3. **AppKit Compatibility**
- Follows Reown's recommended patterns
- Easier to upgrade to full AppKit in the future
- Consistent with modern Web3 standards

### 4. **Backwards Compatibility**
- Existing `AuthContext` continues to work without changes
- Same underlying `DAppConnector` implementation
- No breaking changes to authentication flow

## Architecture

```
┌─────────────────────────────────────┐
│   React Components                  │
│   (UI Layer)                        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   AuthContext                       │
│   (Authentication Logic)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   HederaWalletProvider              │
│   (AppKit-style Provider)           │
│                                     │
│   ┌───────────────────────────┐   │
│   │ HederaAppKitConnector     │   │
│   │ (Wrapper with AppKit API) │   │
│   └────────────┬──────────────┘   │
│                │                    │
└────────────────┼────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   DAppConnector                     │
│   (@hashgraph/hedera-wallet-connect)│
└─────────────────────────────────────┘
```

## Future Enhancements

When upgrading to `@hashgraph/hedera-wallet-connect` v2.0+:

1. Install the canary version:
   ```bash
   npm install @hashgraph/hedera-wallet-connect@2.0.4-canary.3ca04e9.0
   npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem
   ```

2. Replace `HederaAppKitConnector` wrapper with native `HederaAdapter`

3. Use `createAppKit` for full AppKit integration with:
   - Email/social logins
   - On-ramp functionality
   - Smart accounts
   - One-click authentication
   - Wallet notifications

## Technical Notes

### Session Type Definition

Due to package export limitations in v1.5.1, we define a simplified session interface:

```typescript
interface SessionStruct {
  topic: string;
  namespaces?: {
    hedera?: {
      accounts: string[];
      methods: string[];
      events: string[];
    };
  };
  [key: string]: any;
}
```

This matches the WalletConnect `SessionTypes.Struct` interface but avoids import issues.

### Compatibility

- **Works with**: `@hashgraph/hedera-wallet-connect@^1.5.1`
- **Tested on**: Hedera Testnet
- **Supported wallets**: All WalletConnect-compatible Hedera wallets (HashPack, Blade, etc.)

## Support

For issues or questions:
- Check the [Hedera Wallet Connect documentation](https://github.com/hashgraph/hedera-wallet-connect)
- Review the [Reown AppKit docs](https://docs.reown.com/)
- Open an issue in this repository

---

**Migration completed**: 2025-10-27
**Pattern**: Reown AppKit-style
**Status**: Production-ready
