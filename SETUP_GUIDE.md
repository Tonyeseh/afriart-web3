# AfriArt Setup Guide

Complete guide to set up the AfriArt NFT Marketplace development environment.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed ([download](https://nodejs.org/))
- **pnpm** package manager ([install](https://pnpm.io/installation))
- **Git** version control
- A **code editor** (VS Code recommended)
- A **Hedera Testnet account** ([create account](https://portal.hedera.com))
- A **Supabase account** ([sign up](https://supabase.com))
- A **Pinata account** for IPFS ([sign up](https://pinata.cloud))

---

## Quick Start (5 Steps)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd afriart-web3

# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

### 2. Set Up Supabase Database

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name, database password, and region
   - Wait for project creation (~2 minutes)

2. **Run the database schema**
   - Go to **SQL Editor** in Supabase dashboard
   - Copy contents of `backend/database/schema.sql`
   - Paste and click "Run"
   - Verify tables created in **Table Editor**

3. **Get your credentials**
   - Go to **Project Settings** → **API**
   - Copy `URL` and `service_role` key

### 3. Set Up Hedera Testnet

1. **Create Hedera account**
   - Visit [portal.hedera.com](https://portal.hedera.com)
   - Sign up for testnet access
   - Create a new testnet account
   - Fund it with test HBAR from faucet

2. **Get your credentials**
   - **Account ID**: `0.0.xxxxx`
   - **Private Key**: Long hex string starting with `302e...`

3. **Create NFT Collection Token** (do this later after backend is running)
   - We'll create this in Week 4 of MVP plan
   - For now, leave `HEDERA_NFT_COLLECTION_ID` empty

### 4. Set Up Pinata (IPFS)

1. **Create Pinata account**
   - Go to [pinata.cloud](https://pinata.cloud)
   - Sign up for free account

2. **Get API keys**
   - Go to **API Keys** in dashboard
   - Click "New Key"
   - Give it a name like "AfriArt"
   - Copy `API Key` and `API Secret`

### 5. Configure Environment Variables

**Backend (.env)**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```bash
# Server
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Database (from Supabase)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Hedera (from portal.hedera.com)
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_TREASURY_ID=0.0.xxxxx  # Same as operator for now
HEDERA_TREASURY_KEY=302e020100300506032b657004220420...  # Same as operator
HEDERA_NFT_COLLECTION_ID=  # Leave empty for now

# IPFS (from Pinata)
IPFS_PROVIDER=pinata
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here

# Auth
JWT_SECRET=change_this_to_a_random_secret_key_at_least_32_characters
JWT_EXPIRATION=7d

# External APIs
COINGECKO_API_URL=https://api.coingecko.com/api/v3
PRICE_CACHE_DURATION=300

# Platform
PLATFORM_FEE_PERCENT=2
```

**Frontend (.env.local)**
```bash
cd frontend
cp .env.local.example .env.local  # Create this file if it doesn't exist
```

Edit `frontend/.env.local`:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Hedera Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_MIRROR_NODE=https://testnet.mirrornode.hedera.com

# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Supabase (Client-side - use anon key, not service key!)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon key
```

---

## Running the Application

### Start Backend

```bash
cd backend
pnpm dev
```

You should see:
```
🚀 AfriArt Backend running on port 4000
📝 Environment: development
🌐 CORS enabled for: http://localhost:3000
📚 API Documentation: http://localhost:4000/api-docs
```

Test the following endpoints:
- **Health Check:** http://localhost:4000/health
- **API Documentation:** http://localhost:4000/api-docs (Interactive Swagger UI)

### Start Frontend

```bash
# In a new terminal
cd frontend
pnpm dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Open http://localhost:3000 in your browser

---

## Verify Setup

### 1. Backend Health Check

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T10:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Database Connection

Create a test script `backend/src/test-db.ts`:

```typescript
import { supabase } from './config/database';

async function testDatabase() {
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Database connection failed:', error);
  } else {
    console.log('✅ Database connection successful');
  }
}

testDatabase();
```

Run:
```bash
cd backend
npx ts-node src/test-db.ts
```

### 3. Hedera Connection

Create `backend/src/test-hedera.ts`:

```typescript
import { Client, AccountBalanceQuery } from '@hashgraph/sdk';

async function testHedera() {
  const client = Client.forTestnet();
  client.setOperator(
    process.env.HEDERA_OPERATOR_ID!,
    process.env.HEDERA_OPERATOR_KEY!
  );

  try {
    const balance = await new AccountBalanceQuery()
      .setAccountId(process.env.HEDERA_OPERATOR_ID!)
      .execute(client);

    console.log(`✅ Hedera connected! Balance: ${balance.hbars.toString()}`);
  } catch (error) {
    console.error('❌ Hedera connection failed:', error);
  }

  client.close();
}

testHedera();
```

Run:
```bash
npx ts-node src/test-hedera.ts
```

### 4. IPFS Connection

Create `backend/src/test-ipfs.ts`:

```typescript
import axios from 'axios';
import FormData from 'form-data';

async function testIPFS() {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  const data = { test: 'Hello from AfriArt!' };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY!
      }
    });

    console.log('✅ IPFS connected! CID:', response.data.IpfsHash);
  } catch (error) {
    console.error('❌ IPFS connection failed:', error);
  }
}

testIPFS();
```

Run:
```bash
npx ts-node src/test-ipfs.ts
```

---

## Common Issues & Solutions

### Issue: Port 4000 already in use

**Solution:**
```bash
# Find process using port 4000
lsof -ti:4000

# Kill the process
lsof -ti:4000 | xargs kill -9

# Or use a different port
PORT=4001 pnpm dev
```

### Issue: Supabase connection fails

**Check:**
- URL and service key are correct
- No trailing slashes in URL
- Using `service_role` key, not `anon` key for backend
- Supabase project is active

**Solution:**
```bash
# Test connection
curl https://your-project.supabase.co/rest/v1/
```

### Issue: Hedera "INVALID_ACCOUNT_ID"

**Check:**
- Account ID format: `0.0.xxxxx` (not just the number)
- Private key format: Starts with `302e020100...`
- Account has test HBAR (check on portal.hedera.com)

**Solution:**
```bash
# Verify account exists
curl "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.xxxxx"
```

### Issue: pnpm not found

**Solution:**
```bash
npm install -g pnpm
```

### Issue: TypeScript errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules dist
pnpm install
pnpm build
```

---

## Next Steps

Now that your environment is set up:

1. **Read the MVP Plan**
   - See [MVP_PLAN.md](MVP_PLAN.md) for 8-week roadmap
   - Understand what features we're building

2. **Review UI Improvements**
   - See [UI_REVIEW_AND_IMPROVEMENTS.md](UI_REVIEW_AND_IMPROVEMENTS.md)
   - Understand frontend enhancements needed

3. **Start Week 1 Tasks** (Backend Foundation)
   - Implement authentication endpoints
   - Create user registration flow
   - Set up JWT authentication

4. **Join Development**
   - Check GitHub issues
   - Pick a task from MVP plan
   - Create a feature branch

---

## Development Workflow

### Creating a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Make changes
# ... code ...

# 3. Test locally
pnpm dev  # backend and frontend

# 4. Commit changes
git add .
git commit -m "feat: implement user authentication"

# 5. Push to remote
git push origin feature/user-authentication

# 6. Create Pull Request
# Go to GitHub and create PR
```

### Running Tests (when implemented)

```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend
pnpm test
```

### Code Style

```bash
# Backend linting
cd backend
pnpm lint

# Frontend linting (if configured)
cd frontend
pnpm lint
```

---

## Useful Commands

### Backend

```bash
cd backend

pnpm dev          # Start dev server with hot reload
pnpm build        # Compile TypeScript
pnpm start        # Run compiled code
pnpm lint         # Check code style
pnpm test         # Run tests
```

### Frontend

```bash
cd frontend

pnpm dev          # Start Next.js dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests
```

### Database

```bash
# Access Supabase SQL editor
# Go to https://app.supabase.com
# Navigate to SQL Editor

# Run migrations manually
psql $DATABASE_URL < backend/database/schema.sql
```

---

## Project URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **Backend Health**: http://localhost:4000/health
- **Supabase Dashboard**: https://app.supabase.com
- **Hedera Portal**: https://portal.hedera.com
- **Hedera Mirror Node**: https://testnet.mirrornode.hedera.com

---

## Getting Help

### Documentation
- [PROJECT_PLAN.md](PROJECT_PLAN.md) - Full implementation plan
- [MVP_PLAN.md](MVP_PLAN.md) - 8-week MVP roadmap
- [backend/README.md](backend/README.md) - Backend docs
- [UI_REVIEW_AND_IMPROVEMENTS.md](UI_REVIEW_AND_IMPROVEMENTS.md) - UI guide

### External Resources
- [Hedera Docs](https://docs.hedera.com)
- [HIP-412 Standard](https://hips.hedera.com/hip/hip-412)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Pinata Docs](https://docs.pinata.cloud)

### Troubleshooting
- Check logs in terminal
- Inspect Network tab in browser DevTools
- Check Supabase logs
- Check Hedera Mirror Node for transactions

---

## Ready to Build! 🚀

You're all set! Start with Week 1 of the MVP plan:

1. Implement authentication (Week 2 - we did Week 1 setup already!)
2. IPFS file upload (Week 3)
3. NFT minting (Week 4)
4. Marketplace (Week 5-6)

Happy coding!
