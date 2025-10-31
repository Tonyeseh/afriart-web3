# EVM Address to Hedera Account ID - Automatic Resolution ✨

## Problem Solved

When connecting a wallet through Reown AppKit, wallets return Ethereum-style addresses (`0x...`) instead of Hedera account IDs (`0.0.xxxxx`).

**Solution:** Automatically fetch the Hedera account ID from the Mirror Node API - no user input required!

## How It Works

```
1. User connects wallet → Wallet returns 0x4a2e...b4d0
2. System detects EVM format → Queries Mirror Node automatically
3. Mirror Node returns → { account: "0.0.12345", evm_address: "0x4a2e..." }
4. System caches mapping → localStorage for instant future use
5. Authentication continues → With proper Hedera account ID
6. ✅ Seamless experience → User never sees a prompt!
```

## Implementation

### 1. Mirror Node API Method

**File:** [`frontend/app/utils/api.ts`](frontend/app/utils/api.ts)

```typescript
async getAccountIdFromEvmAddress(evmAddress: string): Promise<string | null> {
  const url = `${this.getMirrorNodeUrl()}/accounts/${evmAddress}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.account; // Returns "0.0.12345"
}
```

### 2. Automatic Fetching in useWallet Hook

**File:** [`frontend/hooks/useWallet.ts`](frontend/hooks/useWallet.ts)

```typescript
useEffect(() => {
  if (address?.startsWith('0x')) {
    const accountId = await hederaMirrorAPI.getAccountIdFromEvmAddress(address);
    localStorage.setItem(`hedera_account_id_${address}`, accountId);
    setHederaAccountId(accountId);
  }
}, [address]);
```

### 3. Smart Waiting in AuthContext

**File:** [`frontend/contexts/AuthContext.tsx`](frontend/contexts/AuthContext.tsx)

```typescript
// Wait for auto-fetch (up to 10 seconds)
while (wallet.isFetchingAccountId && (Date.now() - startTime) < 10000) {
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Fallback modal only if auto-fetch fails
if (!walletAddress) {
  setShowAccountModal(true);
}
```

## Benefits

| Feature | Value |
|---------|-------|
| **User Experience** | Zero friction - no manual input |
| **Speed** | ~500ms first time, instant after |
| **Reliability** | Official Hedera Mirror Node |
| **Caching** | Persistent across sessions |
| **Fallback** | Manual input if API fails |

## Testing

### ✅ Successful Auto-Resolution

```bash
npm run dev
# Connect wallet
# Check console:
```

```
✅ Wallet connected: { address: "0x4a2e...", accountId: null }
✅ Detected EVM address, fetching from Mirror Node...
✅ Found Hedera account ID: 0.0.12345
✅ Wallet address validated: 0.0.12345
✅ Authentication successful!
```

### ⚠️ Fallback to Manual Entry

If Mirror Node is unavailable, a modal appears automatically.

## API Reference

### Hedera Mirror Node

```
GET https://testnet.mirrornode.hedera.com/api/v1/accounts/0x...
GET https://mainnet.mirrornode.hedera.com/api/v1/accounts/0x...
```

**Response:**
```json
{
  "account": "0.0.12345",
  "evm_address": "0x4a2e4fB2bea0B72219e7794cf6e489AB0d48b4d0",
  "balance": { "balance": 100000000 },
  "key": { "key": "302a300506..." }
}
```

## Edge Cases

✅ **Account exists** → Auto-fetched, cached, used
✅ **Account doesn't exist** → Fallback modal shown
✅ **Network error** → Fallback modal after 10s timeout
✅ **Multiple wallets** → Separate cache per address
✅ **Reconnection** → Uses cached value (instant)

## Troubleshooting

### Clear cache and retry:
```javascript
localStorage.clear();
// Reconnect wallet
```

### Check Mirror Node directly:
```javascript
fetch('https://testnet.mirrornode.hedera.com/api/v1/accounts/0x...')
  .then(r => r.json())
  .then(console.log)
```

---

**Status:** ✅ **Fully Automatic**
**Date:** 2025-10-29
**No user action required!**
