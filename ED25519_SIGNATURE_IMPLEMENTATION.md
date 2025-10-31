# ED25519 Signature Implementation for Hedera Wallets

## Overview

This document describes how AfriArt ensures that wallet signatures use **ED25519** (Hedera's native signature algorithm) instead of **ECDSA** (Ethereum's standard).

## The Problem

When using Reown AppKit with Wagmi for Hedera wallet connections:
- AppKit treats Hedera as an EVM-compatible chain
- By default, Wagmi uses **ECDSA** signing (Ethereum standard)
- Hedera wallets (HashPack, Blade) natively support **ED25519** signing
- Backend expects ED25519 signatures for proper verification

**Without this implementation**: Signatures would fail verification because the backend expects ED25519 but receives ECDSA.

## The Solution

### Intelligent Wallet Detection

The `useWallet` hook now detects the wallet type and routes to the appropriate signing method:

```typescript
// 1. Detect Hedera-native wallets
const isHederaNativeWallet = useCallback((): boolean => {
  const connectorName = connectorClient?.connector?.name?.toLowerCase() || '';
  const hederaWallets = ['hashpack', 'blade', 'kabila', 'wallawallet'];
  return hederaWallets.some(name => connectorName.includes(name));
}, [connectorClient]);

// 2. Route to appropriate signing method
if (isHederaNativeWallet() && window.hashpack) {
  // Use HashPack's ED25519 signing
  return hashpack.signMessage({ message, signingAccount });
} else {
  // Fallback to Wagmi (ECDSA)
  return signMessageAsync({ message, account });
}
```

### Wallet-Specific Implementation

#### HashPack Wallet (ED25519)

```typescript
const response = await window.hashpack.signMessage({
  message: message,
  signingAccount: hederaAccountId || address
});

// Returns: { success: true, signatureMap: "base64..." }
// Format: Base64-encoded protobuf SignatureMap with ED25519 signature
```

#### Blade Wallet (ED25519)

```typescript
const response = await window.blade.sign(
  message,
  hederaAccountId || address
);

// Returns: { success: true, signatureMap: "base64..." }
// Format: Base64-encoded protobuf SignatureMap with ED25519 signature
```

#### Generic EVM Wallets (ECDSA)

```typescript
const signature = await signMessageAsync({
  message,
  account: address as `0x${string}`
});

// Returns: hex-encoded ECDSA signature
// Note: This path is a fallback and may not work with backend
```

## Backend Verification

The backend ([auth.service.ts:92-266](backend/src/services/auth.service.ts#L92-L266)) is already configured to handle ED25519 signatures:

### 1. Public Key Parsing

```typescript
if (publicKeyString.length === 64) {
  // Raw hex ED25519 key (32 bytes)
  const publicKeyBytes = Buffer.from(publicKeyString, 'hex');
  publicKey = PublicKey.fromBytesED25519(publicKeyBytes);
}
```

### 2. Signature Extraction

The backend handles two signature formats:

**Format 1: Base64-encoded protobuf SignatureMap** (from HashPack/Blade)
```
SignatureMap {
  sigPair: [
    {
      pubKeyPrefix: bytes,  // 32-byte public key prefix
      ed25519: bytes        // 64-byte ED25519 signature
    }
  ]
}
```

The backend parses this protobuf structure and extracts the 64-byte ED25519 signature:

```typescript
// Parse protobuf SignatureMap
if (signatureBytes.length > 64) {
  // Extract ed25519 field (field 2, wire type 2)
  signatureBytes = extractedSig; // 64 bytes
}
```

**Format 2: Raw 64-byte signature** (fallback)
```typescript
if (signatureBytes.length === 64) {
  // Already in correct format
}
```

### 3. Message Hashing

Hedera wallets sign the **SHA-384 hash** of the message, not the raw message:

```typescript
const messageHash = createHash('sha384')
  .update(message, 'utf-8')
  .digest();
```

### 4. Signature Verification

```typescript
const isValid = publicKey.verify(messageBytes, signatureBytes);
```

This uses Hedera SDK's `PublicKey.verify()` which expects:
- ED25519 public key
- SHA-384 hashed message
- 64-byte ED25519 signature

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      USER CONNECTS WALLET                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Reown AppKit Modal  │
         │   (Wallet Selection)  │
         └───────────┬───────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
  ┌───────────────┐    ┌───────────────┐
  │   HashPack    │    │  Blade/Other  │
  │   (ED25519)   │    │   (ED25519)   │
  └───────┬───────┘    └───────┬───────┘
          │                     │
          └──────────┬──────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   useWallet Hook      │
         │   Detects wallet type │
         └───────────┬───────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ HashPack │  │  Blade   │  │  Wagmi   │
│ ED25519  │  │ ED25519  │  │  ECDSA   │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Base64 SignatureMap│
         │  (ED25519 signature)│
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   Backend Receives   │
         │   ED25519 Signature  │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Parse SignatureMap  │
         │  Extract 64-byte sig │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Verify with Hedera  │
         │  SDK (ED25519)       │
         └──────────┬───────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
    ┌────────┐          ┌──────────┐
    │  ✅ OK │          │  ❌ Fail │
    └────────┘          └──────────┘
```

## Implementation Files

### Frontend

1. **[frontend/hooks/useWallet.ts](frontend/hooks/useWallet.ts)**
   - `isHederaNativeWallet()`: Detects Hedera wallet type
   - `signMessage()`: Routes to appropriate signing method
   - ED25519 signing via `window.hashpack` or `window.blade`
   - Fallback to Wagmi for non-Hedera wallets

2. **[frontend/types/wallet.d.ts](frontend/types/wallet.d.ts)** (NEW)
   - TypeScript declarations for `window.hashpack` and `window.blade`
   - Defines signature response types

3. **[frontend/contexts/AuthContext.tsx](frontend/contexts/AuthContext.tsx)**
   - Calls `wallet.signMessage()` during authentication
   - Passes signature to backend for verification

### Backend

1. **[backend/src/services/auth.service.ts](backend/src/services/auth.service.ts)**
   - `verifyWalletSignature()`: Verifies ED25519 signatures
   - Parses protobuf SignatureMap structure
   - Extracts 64-byte ED25519 signature
   - Verifies using Hedera SDK

## Testing

### Manual Testing Steps

1. **Connect HashPack Wallet**
   ```bash
   npm run dev
   # Click "Connect Wallet"
   # Select HashPack
   # Sign authentication message
   # Check console for: "Detected Hedera-native wallet (HashPack), using ED25519 signing"
   ```

2. **Verify Backend Logs**
   ```bash
   # Backend should log:
   ✅ Parsed raw hex ED25519 key
   ✅ Decoded signature as base64
   ✅ SignatureMap detected, parsing protobuf
   ✅ Extracted ED25519 signature from protobuf
   ✅ Wallet signature verification result: true
   ```

3. **Connect Blade Wallet**
   ```bash
   # Same steps as HashPack
   # Check console for: "Detected Hedera-native wallet (Blade), using ED25519 signing"
   ```

### Expected Console Output

**Frontend (HashPack)**:
```
✅ Wallet connected: { address: "0x4a2e...", accountId: "0.0.12345" }
✅ Detected Hedera-native wallet (HashPack), using ED25519 signing
✅ ED25519 signature obtained from HashPack
✅ Signature: base64_string...
```

**Backend**:
```
✅ Attempting signature verification
✅ Parsed raw hex ED25519 key
✅ Decoded signature as base64 (length: 123)
✅ SignatureMap detected, parsing protobuf
✅ Extracted ED25519 signature (length: 64)
✅ Wallet signature verification result: true
```

## Edge Cases & Fallbacks

### Case 1: Hedera Wallet Not Available
```typescript
if (isHederaNativeWallet() && window.hashpack) {
  // Use ED25519
} else {
  // Fallback to Wagmi (ECDSA)
  // ⚠️ May fail backend verification
}
```

### Case 2: Native Signing Fails
```typescript
try {
  return await hashpack.signMessage({ ... });
} catch (error) {
  console.error('HashPack signing failed, falling back to Wagmi');
  // Fallback to Wagmi
}
```

### Case 3: Generic EVM Wallet
- MetaMask, Rainbow, Coinbase Wallet, etc.
- Will use ECDSA signing via Wagmi
- **May not work with backend** (backend expects ED25519)
- Future enhancement: Support ECDSA verification in backend

## Security Considerations

1. **Message Hashing**: Backend hashes messages with SHA-384 before verification (Hedera standard)
2. **Timestamp Validation**: Messages expire after 5 minutes
3. **Public Key Verification**: Public key fetched from Hedera Mirror Node (trusted source)
4. **Signature Format**: SignatureMap protobuf prevents signature malleability

## Future Enhancements

1. **Support ECDSA**: Add ECDSA verification path for generic EVM wallets
2. **More Hedera Wallets**: Add support for Kabila, WallaWallet, etc.
3. **Hardware Wallets**: Support Ledger with ED25519
4. **Signature Caching**: Cache signatures for repeated authentication

## References

- [Hedera Signature Algorithms](https://docs.hedera.com/hedera/core-concepts/keys-and-signatures)
- [HashPack Extension API](https://github.com/Hashpack/hashconnect)
- [Blade Wallet API](https://docs.bladewallet.io/)
- [Reown AppKit Documentation](https://docs.reown.com/appkit/overview)
- [Wagmi Documentation](https://wagmi.sh/)

---

**Status**: ✅ Fully Implemented
**Date**: 2025-10-29
**Verified**: ED25519 signatures working for HashPack and Blade wallets
