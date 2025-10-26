# AfriArt Authentication Implementation Guide

## ✅ Completed Implementation

All authentication requirements from the MVP plan have been successfully implemented:

- [x] Update WalletProvider to use real Hedera connection
- [x] Implement real wallet connect flow
- [x] Store JWT in localStorage
- [x] Add auth headers to API requests
- [x] Test user registration flow

---

## 📁 File Structure

```
frontend/
├── contexts/
│   ├── WalletProvider.tsx          # Hedera wallet connector
│   └── AuthContext.tsx             # ✨ NEW: Authentication context
├── app/
│   ├── components/
│   │   ├── RegistrationModal.tsx   # ✨ NEW: User registration UI
│   │   ├── AppLayout.tsx           # Updated with auth integration
│   │   └── Navbar.tsx              # Updated with user dropdown
│   ├── hooks/
│   │   └── useDebounce.ts          # ✨ NEW: Performance hook
│   ├── utils/
│   │   └── api.ts                  # Updated with auth headers
│   └── layout.tsx                  # Updated with AuthProvider
└── .env.example                    # ✨ NEW: Environment variables template
```

---

## 🔐 Authentication Flow

### 1. **User Connects Wallet**

```typescript
// User clicks "Connect Wallet" button
await connectWallet();

// Behind the scenes:
// 1. Initialize Hedera Wallet Connector
// 2. Open wallet selection modal
// 3. Get connected wallet address (e.g., "0.0.123456")
```

### 2. **Get Authentication Message**

```typescript
// Frontend requests a unique message from backend
GET /api/auth/message?walletAddress=0.0.123456

// Backend returns timestamped message (valid for 5 minutes):
{
  "message": "AfriArt Authentication\n\nWallet: 0.0.123456\nTimestamp: 1234567890\nNonce: abc123"
}
```

### 3. **Sign Message with Wallet**

```typescript
// User signs message in their Hedera wallet (NO blockchain transaction)
const signature = await walletConnector.signMessage({
  message: messageBytes,
  signerAccountId: walletAddress
});
```

### 4. **Verify Signature**

```typescript
// Frontend sends signature to backend for verification
POST /api/auth/verify
{
  "walletAddress": "0.0.123456",
  "message": "AfriArt Authentication...",
  "signature": "hex_encoded_signature",
  "publicKey": "public_key_from_wallet"
}

// Backend:
// 1. Validates message timestamp (not expired)
// 2. Verifies signature using Hedera SDK
// 3. Checks if user exists in database
```

### 5. **Response: Existing User**

```json
{
  "success": true,
  "needsRegistration": false,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "walletAddress": "0.0.123456",
      "role": "artist",
      "displayName": "John Artist",
      "email": "john@example.com",
      ...
    }
  }
}
```

### 6. **Response: New User (Registration Required)**

```json
{
  "success": true,
  "needsRegistration": true,
  "data": {
    "walletAddress": "0.0.123456",
    "publicKey": "..."
  }
}
```

### 7. **New User Registration**

```typescript
// Frontend shows RegistrationModal
// User fills out profile:
POST /api/users/register
{
  "walletAddress": "0.0.123456",
  "role": "artist",              // buyer, artist, or admin
  "displayName": "John Artist",
  "email": "john@example.com",
  "bio": "My artistic journey...",
  "profilePictureUrl": "https://...",
  "socialLinks": {
    "twitter": "@johnartist",
    "instagram": "@johnartist",
    "website": "https://johnartist.com"
  }
}

// Backend creates user and returns JWT token:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

## 🎯 Using Authentication in Frontend

### Use the `useAuth` Hook

```typescript
import { useAuth } from 'contexts/AuthContext';

function MyComponent() {
  const {
    user,              // User object or null
    token,             // JWT token or null
    isAuthenticated,   // Boolean
    isLoading,         // Boolean
    error,             // Error message or null
    connectWallet,     // Function to connect wallet
    disconnectWallet,  // Function to disconnect
    register,          // Function to register new user
    refreshUser        // Function to refresh user data
  } = useAuth();

  // Example: Show user info
  if (isAuthenticated) {
    return <div>Welcome, {user.displayName}!</div>;
  }

  return <button onClick={connectWallet}>Connect Wallet</button>;
}
```

### Making Authenticated API Requests

```typescript
import { userAPI, nftAPI } from '../app/utils/api';

// API functions automatically include auth token from localStorage

// Update user profile
await userAPI.updateProfile('0.0.123456', {
  displayName: 'New Name',
  bio: 'Updated bio'
});

// Create NFT (requires authentication)
await nftAPI.createNFT({
  token_id: '0.0.789',
  creator_wallet: '0.0.123456',
  title: 'My Artwork',
  ...
});
```

---

## 💾 JWT Token Storage

### Automatic Storage

Tokens are automatically stored in `localStorage`:

```typescript
// Storage keys
const TOKEN_KEY = 'afriart_auth_token';
const USER_KEY = 'afriart_user';

// Automatically saved on login
localStorage.setItem(TOKEN_KEY, token);
localStorage.setItem(USER_KEY, JSON.stringify(user));

// Automatically cleared on logout
localStorage.removeItem(TOKEN_KEY);
localStorage.removeItem(USER_KEY);
```

### Token Validation

```typescript
// On app load, AuthContext automatically:
// 1. Loads token from localStorage
// 2. Validates token by calling GET /api/auth/me
// 3. If valid: Sets user state
// 4. If invalid: Clears storage and requires re-login
```

---

## 🔒 Protected Routes

### Backend Middleware

```typescript
// Apply authentication to routes
import { authenticate, requireRole } from './middleware/auth.middleware';

// Require authentication
router.get('/protected', authenticate, handler);

// Require specific role
router.post('/admin-only', authenticate, requireRole('admin'), handler);

// Require wallet ownership
router.patch('/:walletAddress', authenticate, requireWalletOwnership, handler);
```

### Frontend Protection

```typescript
function ProtectedComponent() {
  const { isAuthenticated, connectWallet } = useAuth();

  if (!isAuthenticated) {
    return (
      <div>
        <p>Please connect your wallet to continue</p>
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>
    );
  }

  return <div>Protected content...</div>;
}
```

---

## 🌐 Environment Variables

### Frontend (`.env.local`)

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Optional
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (`.env`)

```bash
# Required for JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/afriart

# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## 🧪 Testing the Flow

### Manual Testing Steps

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   # Server should run on http://localhost:4000
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   # App should run on http://localhost:3000
   ```

3. **Connect Wallet**
   - Click "Connect Wallet" in Navbar
   - Select HashPack or Blade wallet
   - Approve connection in wallet

4. **Sign Authentication Message**
   - Wallet will prompt to sign message
   - Approve signature (NO gas fees)

5. **For New Users**
   - Registration modal appears
   - Fill out profile (role, display name, etc.)
   - Click "Complete Registration"
   - JWT token saved to localStorage

6. **For Existing Users**
   - Automatically logged in
   - User data loaded from backend
   - Token saved to localStorage

7. **Verify Authentication**
   - Refresh page
   - Should remain logged in
   - User dropdown shows in Navbar

8. **Test Protected Actions**
   - Try creating an NFT (requires auth)
   - Try placing a bid (requires auth)
   - Try updating profile (requires auth + wallet ownership)

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to connect wallet"
**Solution**:
- Ensure WalletConnect Project ID is set in `.env.local`
- Get a free project ID from https://cloud.walletconnect.com/

### Issue: "Token expired" or "Unauthorized"
**Solution**:
- JWT tokens expire after 7 days by default
- User needs to reconnect wallet
- Check `JWT_EXPIRATION` in backend `.env`

### Issue: "CORS error"
**Solution**:
- Backend `CORS_ORIGIN` must match frontend URL
- For local dev: `CORS_ORIGIN=http://localhost:3000`
- For production: Use your deployed frontend URL

### Issue: Registration modal doesn't appear
**Solution**:
- Check browser console for errors
- Verify `sessionStorage` has `pending_wallet_address`
- Ensure `AuthProvider` is wrapping `AppLayout` in layout.tsx

### Issue: "Cannot read properties of undefined (reading 'walletAddress')"
**Solution**:
- Check that `useAuth` is called inside `AuthProvider`
- Verify layout.tsx has proper provider hierarchy
- Use optional chaining: `user?.walletAddress`

---

## 📊 Authentication State Diagram

```
┌─────────────────┐
│ App Loads       │
└────────┬────────┘
         │
         ├──[Check localStorage]
         │
    ┌────┴────┐
    │ Token?  │
    └────┬────┘
         │
    YES  │  NO
    ┌────┴────┐
    │         │
┌───▼────┐ ┌─▼──────────┐
│Validate│ │Show Connect│
│Token   │ │Button      │
└───┬────┘ └─┬──────────┘
    │        │
VALID│ INVALID│
    │        │
┌───▼────┐ ┌▼───────────┐
│Set User│ │Clear       │
│State   │ │Storage     │
└────────┘ └────────────┘
```

---

## ✅ All MVP Requirements Met

| Requirement | Status | File |
|------------|--------|------|
| Real Hedera connection | ✅ | `WalletProvider.tsx` |
| Wallet connect flow | ✅ | `AuthContext.tsx` |
| JWT in localStorage | ✅ | `AuthContext.tsx:65-72` |
| Auth headers on API | ✅ | `api.ts:22-27` |
| User registration | ✅ | `RegistrationModal.tsx` |

---

## 🚀 Next Steps

### High Priority
- [ ] Add loading spinners during wallet connection
- [ ] Implement email verification (optional)
- [ ] Add "Remember me" checkbox
- [ ] Handle wallet disconnect events
- [ ] Add profile picture upload (to IPFS/Arweave)

### Medium Priority
- [ ] Add social login options
- [ ] Implement 2FA for sensitive operations
- [ ] Add session timeout warnings
- [ ] Create user settings page
- [ ] Add wallet address change detection

### Nice to Have
- [ ] Multi-wallet support (connect multiple wallets)
- [ ] Wallet-based message encryption
- [ ] Activity log (login history)
- [ ] Account recovery flow
- [ ] Trusted devices management

---

## 📚 Additional Resources

- [Hedera Wallet Connect Docs](https://docs.hedera.com/hedera/tutorials/more-tutorials/dapp-tutorials)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [WalletConnect Documentation](https://docs.walletconnect.com/)

---

**Implementation completed successfully! 🎉**

All authentication features are now live and ready for testing.
