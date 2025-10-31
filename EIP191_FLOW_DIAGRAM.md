# EIP-191 Authentication Flow Diagram

## Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER AUTHENTICATION FLOW                            │
│                         (EIP-191 Implementation)                            │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: WALLET CONNECTION
═══════════════════════════════════════════════════════════════════════════════

┌──────────────┐
│   User       │
│   Clicks     │──────┐
│  "Connect"   │      │
└──────────────┘      │
                      ▼
            ┌─────────────────────┐
            │  Reown AppKit Modal │
            │   Opens             │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ User Selects Wallet │
            │ (MetaMask, HashPack,│
            │  Blade, etc.)       │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ Wallet Connected    │
            │ ✓ EVM Address       │
            │ ✓ Network Info      │
            └──────────┬──────────┘
                       │
                       ▼


STEP 2: HEDERA ACCOUNT ID RESOLUTION
═══════════════════════════════════════════════════════════════════════════════

            ┌─────────────────────┐
            │ Detect Address Type │
            └──────────┬──────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    ┌───────────┐           ┌────────────────┐
    │ EVM Addr  │           │ Hedera Format  │
    │ (0x...)   │           │ (0.0.xxxxx)    │
    └─────┬─────┘           └────────┬───────┘
          │                          │
          │                          │ Use directly
          │                          │
          ▼                          ▼
    ┌───────────────────┐     ┌──────────────┐
    │ Call Mirror Node  │     │ Account ID   │
    │ API               │     │ Ready        │
    └─────┬─────────────┘     └──────┬───────┘
          │                          │
    Success│  Failed                 │
          ▼      ▼                   │
    ┌──────┐  ┌────────────────┐    │
    │Got ID│  │ Show Manual    │    │
    │      │  │ Entry Modal    │    │
    └───┬──┘  └────────┬───────┘    │
        │              │             │
        │              ▼             │
        │     ┌────────────────┐    │
        │     │ User Enters    │    │
        │     │ Account ID     │    │
        │     └────────┬───────┘    │
        │              │             │
        └──────────────┴─────────────┘
                       │
                       ▼


STEP 3: REQUEST AUTH MESSAGE
═══════════════════════════════════════════════════════════════════════════════

            ┌─────────────────────────────────┐
            │ Frontend: GET /api/auth/message │
            │ ?walletAddress=0.0.12345        │
            └──────────────┬──────────────────┘
                           │
                           ▼
            ┌─────────────────────────────────┐
            │ Backend: Generate Auth Message  │
            │                                 │
            │ Message Format:                 │
            │ ┌─────────────────────────────┐ │
            │ │ Welcome to AfriArt!         │ │
            │ │                             │ │
            │ │ Sign this message to        │ │
            │ │ authenticate your wallet.   │ │
            │ │                             │ │
            │ │ Wallet: 0.0.12345           │ │
            │ │ Timestamp: 1730390000000    │ │
            │ │                             │ │
            │ │ This will not cost fees.    │ │
            │ └─────────────────────────────┘ │
            └──────────────┬──────────────────┘
                           │
                           ▼
            ┌─────────────────────────────────┐
            │ Response:                        │
            │ {                               │
            │   success: true,                │
            │   data: {                       │
            │     message: "Welcome...",      │
            │     timestamp: "1730390000000", │
            │     walletAddress: "0.0.12345"  │
            │   }                             │
            │ }                               │
            └──────────────┬──────────────────┘
                           │
                           ▼


STEP 4: MESSAGE SIGNING (EIP-191)
═══════════════════════════════════════════════════════════════════════════════

            ┌─────────────────────────────────┐
            │ Frontend: wallet.signMessage()  │
            └──────────────┬──────────────────┘
                           │
                           ▼
            ┌─────────────────────────────────┐
            │ Wagmi Hook: signMessageAsync()  │
            │                                 │
            │ Input: "Welcome to AfriArt!..." │
            └──────────────┬──────────────────┘
                           │
                           ▼
            ┌─────────────────────────────────────────────────┐
            │ WALLET PROCESSING                               │
            │                                                 │
            │ Step 1: EIP-191 Formatting                      │
            │ ┌─────────────────────────────────────────────┐ │
            │ │ Add Prefix:                                 │ │
            │ │ "\x19Ethereum Signed Message:\n"            │ │
            │ │                                             │ │
            │ │ Add Length:                                 │ │
            │ │ "128" (message length)                      │ │
            │ │                                             │ │
            │ │ Formatted Message:                          │ │
            │ │ "\x19Ethereum Signed Message:\n128Welcome..." │
            │ └─────────────────────────────────────────────┘ │
            │                                                 │
            │ Step 2: Hash with Keccak256                     │
            │ ┌─────────────────────────────────────────────┐ │
            │ │ messageHash = keccak256(formatted)          │ │
            │ │ Result: 0xa1de9886... (32 bytes)           │ │
            │ └─────────────────────────────────────────────┘ │
            │                                                 │
            │ Step 3: ECDSA Signing                           │
            │ ┌─────────────────────────────────────────────┐ │
            │ │ Generate random k (nonce)                   │ │
            │ │ Calculate R = k × G                         │ │
            │ │ Calculate r = R.x mod n                     │ │
            │ │ Calculate s = k⁻¹(H + r×privKey) mod n     │ │
            │ │ Determine v (recovery id: 27 or 28)        │ │
            │ │                                             │ │
            │ │ Signature = r (32B) + s (32B) + v (1B)     │ │
            │ └─────────────────────────────────────────────┘ │
            │                                                 │
            │ Step 4: User Approval                           │
            │ ┌─────────────────────────────────────────────┐ │
            │ │ Wallet shows popup:                         │ │
            │ │ "Sign this message?"                        │ │
            │ │                                             │ │
            │ │ Welcome to AfriArt!                         │ │
            │ │ ...                                         │ │
            │ │                                             │ │
            │ │ [Cancel] [Sign]                             │ │
            │ └─────────────────────────────────────────────┘ │
            └─────────────────────┬───────────────────────────┘
                                  │ User clicks "Sign"
                                  ▼
            ┌─────────────────────────────────────┐
            │ Signature Returned to Frontend      │
            │                                     │
            │ Format: 0x + 130 hex chars          │
            │ Example: 0x1234abcd...ef56          │
            │                                     │
            │ Length: 132 characters              │
            │ - 0x: 2 chars                       │
            │ - r: 64 hex chars (32 bytes)        │
            │ - s: 64 hex chars (32 bytes)        │
            │ - v: 2 hex chars (1 byte)           │
            └─────────────────────┬───────────────┘
                                  │
                                  ▼


STEP 5: SIGNATURE VERIFICATION
═══════════════════════════════════════════════════════════════════════════════

            ┌─────────────────────────────────────────┐
            │ Frontend: POST /api/auth/verify         │
            │                                         │
            │ Body:                                   │
            │ {                                       │
            │   walletAddress: "0.0.12345",           │
            │   message: "Welcome to AfriArt!...",    │
            │   signature: "0x1234abcd...ef56",       │
            │   evmAddress: "0xabc123..."             │
            │ }                                       │
            └─────────────────────┬───────────────────┘
                                  │
                                  ▼
            ┌─────────────────────────────────────────────────┐
            │ BACKEND VERIFICATION                            │
            │                                                 │
            │ Step 1: Validate Input                          │
            │ ┌─────────────────────────────────────────────┐ │
            │ │ ✓ Hedera address: /^0\.0\.\d+$/            │ │
            │ │ ✓ EVM address: /^0x[0-9a-fA-F]{40}$/       │ │
            │ │ ✓ Signature: /^0x[0-9a-fA-F]{130}$/        │ │
            │ │ ✓ Message not empty                         │ │
            │ └─────────────────────────────────────────────┘ │
            │                                                 │
            │ Step 2: Recover Address (viem)                  │
            │ ┌─────────────────────────────────────────────┐ │
            │ │ import { recoverMessageAddress }            │ │
            │ │                                             │ │
            │ │ const recovered = await                     │ │
            │ │   recoverMessageAddress({                   │ │
            │ │     message,                                │ │
            │ │     signature                               │ │
            │ │   });                                       │ │
            │ │                                             │ │
            │ │ Process:                                    │ │
            │ │ 1. Apply EIP-191 format to message          │ │
            │ │ 2. Hash with keccak256                      │ │
            │ │ 3. Parse signature (r, s, v)                │ │
            │ │ 4. Recover public key from signature        │ │
            │ │ 5. Derive address from public key           │ │
            │ └─────────────────────────────────────────────┘ │
            │                                                 │
            │ Step 3: Compare Addresses                       │
            │ ┌─────────────────────────────────────────────┐ │
            │ │ Expected: 0xabc123... (from request)        │ │
            │ │ Recovered: 0xabc123... (from signature)     │ │
            │ │                                             │ │
            │ │ isValid =                                   │ │
            │ │   recovered.toLowerCase() ===               │ │
            │ │   expected.toLowerCase()                    │ │
            │ └─────────────────────────────────────────────┘ │
            └─────────────────────┬───────────────────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
            Valid  │                             │  Invalid
                   ▼                             ▼
        ┌──────────────────┐          ┌──────────────────┐
        │ Signature Valid  │          │ Signature Invalid│
        │ ✓ Address Match  │          │ ✗ Address Reject │
        └────────┬─────────┘          └────────┬─────────┘
                 │                             │
                 ▼                             ▼
        ┌──────────────────┐          ┌──────────────────┐
        │ Check Database   │          │ Return Error     │
        │ for User         │          │ Status: 401      │
        └────────┬─────────┘          └──────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
Exists│                     │ New User
      ▼                     ▼
┌────────────┐      ┌──────────────────┐
│ Generate   │      │ Return           │
│ JWT Token  │      │ needsRegistration│
└──────┬─────┘      └────────┬─────────┘
       │                     │
       ▼                     ▼
┌────────────────┐   ┌──────────────────┐
│ Return:        │   │ Return:          │
│ {              │   │ {                │
│   success: true│   │   success: true  │
│   token: "..." │   │   needsReg: true │
│   user: {...}  │   │   data: {        │
│ }              │   │     walletAddr   │
└────────┬───────┘   │     evmAddr      │
         │           │   }              │
         │           │ }                │
         │           └────────┬─────────┘
         │                    │
         └────────────────────┘
                    │
                    ▼


STEP 6: FRONTEND COMPLETION
═══════════════════════════════════════════════════════════════════════════════

         ┌────────────────────┐
         │ Response Received  │
         └──────────┬─────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
Existing │                     │ New User
User     │                     │
         ▼                     ▼
┌─────────────────┐    ┌──────────────────┐
│ Store Token     │    │ Show Registration│
│ Store User      │    │ Form             │
│ in localStorage │    │                  │
└────────┬────────┘    └────────┬─────────┘
         │                      │
         ▼                      │
┌─────────────────┐             │
│ Update Auth     │             │
│ Context         │             │
│ - isAuthenticated│            │
│ - user          │             │
│ - token         │             │
└────────┬────────┘             │
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│ Redirect to     │    │ User Fills Form: │
│ Dashboard       │    │ - Display Name   │
│                 │    │ - Email          │
│ ✅ Logged In!   │    │ - Bio            │
└─────────────────┘    │ - Profile Pic    │
                       └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ POST             │
                       │ /users/register  │
                       └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Store Token      │
                       │ Store User       │
                       │                  │
                       │ ✅ Registered!   │
                       └──────────────────┘

```

---

## Security Features

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                 │
└─────────────────────────────────────────────────────────────────────────┘

Layer 1: EIP-191 Standard
══════════════════════════════════════════════════════════════════════════
✓ Prevents signature replay as transactions
✓ Standard prefix: "\x19Ethereum Signed Message:\n"
✓ Message length included in signed data
✓ Cannot be submitted as blockchain transaction

Layer 2: Cryptographic Verification
══════════════════════════════════════════════════════════════════════════
✓ ECDSA signature on secp256k1 curve
✓ 128-bit security level (2^128 operations to break)
✓ Public key recovery from signature
✓ Address derived from recovered public key

Layer 3: Address Matching
══════════════════════════════════════════════════════════════════════════
✓ Compare recovered address with claimed address
✓ Case-insensitive comparison
✓ Proves wallet ownership without private key exposure

Layer 4: Timestamp Validation
══════════════════════════════════════════════════════════════════════════
✓ Message includes current timestamp
✓ 5-minute expiration window
✓ Prevents old signature replay
✓ Future-dated messages rejected

Layer 5: Format Validation
══════════════════════════════════════════════════════════════════════════
✓ Hedera address: /^0\.0\.\d+$/
✓ EVM address: /^0x[0-9a-fA-F]{40}$/
✓ Signature: /^0x[0-9a-fA-F]{130}$/
✓ Message content validation

Layer 6: No Private Key Exposure
══════════════════════════════════════════════════════════════════════════
✓ Private key stays in wallet
✓ No transmission over network
✓ Signature proves ownership
✓ Zero-knowledge proof concept
```

---

## Data Flow Summary

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│   Database   │
│              │     │              │     │              │
│ • Connect    │     │ • Generate   │     │ • Check User │
│   Wallet     │     │   Message    │     │ • Store JWT  │
│              │     │              │     │              │
│ • Get Hedera │◀────│ • Verify     │◀────│ • Return     │
│   Account ID │     │   Signature  │     │   User Data  │
│              │     │              │     │              │
│ • Sign       │     │ • Recover    │     │              │
│   Message    │     │   Address    │     │              │
│   (EIP-191)  │     │              │     │              │
│              │     │ • Compare    │     │              │
│ • Send to    │────▶│   Addresses  │     │              │
│   Backend    │     │              │     │              │
│              │     │ • Generate   │     │              │
│ • Store      │◀────│   JWT        │     │              │
│   Token      │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
      │                     │                     │
      │                     │                     │
      ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ localStorage │     │   Logger     │     │  Supabase    │
│ • Token      │     │ • Events     │     │  • users     │
│ • User Data  │     │ • Errors     │     │  • tokens    │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Comparison: Before vs After

```
BEFORE (ED25519 / Mixed Approach)
═══════════════════════════════════════════════════════════════════════════
Frontend                          Backend
───────────────────────────────────────────────────────────────────────────
1. Detect wallet type             1. Wait for message request
2. Use different signing          2. Generate auth message
   methods per wallet             3. Wait for signature
3. HashPack → ED25519             4. Receive: message, signature, publicKey
4. Blade → ED25519                5. Parse public key (ED25519 or ECDSA)
5. Others → ECDSA                 6. Decode signature from hex/base64
6. Fetch public key from          7. Verify with Hedera SDK
   Mirror Node                    8. Return result
7. Send: message, sig, pubKey
8. Handle response

AFTER (EIP-191 Universal Approach)
═══════════════════════════════════════════════════════════════════════════
Frontend                          Backend
───────────────────────────────────────────────────────────────────────────
1. Connect wallet (any)           1. Generate auth message
2. Get EVM address                2. Wait for signature
3. Sign with Wagmi                3. Receive: message, signature, evmAddress
   (auto EIP-191)                 4. Recover address with viem
4. Send: message, sig,            5. Compare recovered vs expected
   evmAddress                     6. Return result
5. Handle response

Benefits
───────────────────────────────────────────────────────────────────────────
✅ Simpler code                   ✅ No public key needed
✅ One signing method             ✅ Standard verification
✅ Universal support              ✅ Better security
✅ Less edge cases                ✅ Cleaner API
```

---

*Diagram created: October 31, 2025*
*Implementation: ✅ COMPLETE*
