# AfriArt Database Setup Guide

Complete guide for setting up and managing the AfriArt PostgreSQL database on Supabase.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Database Schema](#database-schema)
4. [Running Migrations](#running-migrations)
5. [Seeding Test Data](#seeding-test-data)
6. [Testing Connection](#testing-connection)
7. [Connection Pooling](#connection-pooling)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The AfriArt database uses PostgreSQL (via Supabase) with the following structure:

- **Users** - All platform users (buyers, artists, admins)
- **Artists** - Artist verification and portfolio data
- **NFTs** - Minted NFT metadata and ownership
- **Sales** - Transaction history
- **User Favorites** - User's favorited NFTs
- **Platform Settings** - Configuration values

---

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in details:
   - **Name:** afriart-marketplace
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to you
4. Wait ~2 minutes for project creation

### 2. Get Connection Details

In your Supabase project:
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (anon key for client, service key for backend)

### 3. Configure Environment

Add to `backend/.env`:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run Schema Migration

In Supabase Dashboard:
1. Go to **SQL Editor**
2. Click **New Query**
3. Copy contents of `schema.sql`
4. Paste and click **Run**

✅ You should see: "Success. No rows returned"

### 5. Seed Test Data (Optional)

1. In **SQL Editor**, create new query
2. Copy contents of `seed.sql`
3. Paste and click **Run**

✅ You should see a summary of created records

### 6. Test Connection

```bash
cd backend
pnpm db:test
```

✅ All tests should pass

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(50) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'artist', 'admin')),
  display_name VARCHAR(100),
  email VARCHAR(255),
  bio TEXT,
  profile_picture_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_users_wallet` on `wallet_address`
- `idx_users_role` on `role`

### Artists Table

```sql
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  verification_status VARCHAR(20) DEFAULT 'pending',
  kyc_documents JSONB DEFAULT '[]',
  portfolio_urls JSONB DEFAULT '[]',
  rejection_reason TEXT,
  submitted_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_artists_user` on `user_id`
- `idx_artists_status` on `verification_status`

### NFTs Table

```sql
CREATE TABLE nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id VARCHAR(100) UNIQUE NOT NULL,
  serial_number INTEGER,
  creator_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  art_technique VARCHAR(100),
  art_material VARCHAR(100),
  image_url TEXT NOT NULL,
  image_ipfs_cid VARCHAR(100),
  metadata_url TEXT,
  metadata_ipfs_cid VARCHAR(100),
  file_type VARCHAR(50),
  file_size_bytes BIGINT,
  price_hbar DECIMAL(20, 8),
  price_usd DECIMAL(20, 2),
  is_listed BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  minted_at TIMESTAMP
);
```

**Indexes:**
- `idx_nfts_token` on `token_id`
- `idx_nfts_creator` on `creator_id`
- `idx_nfts_owner` on `owner_id`
- `idx_nfts_listed` on `is_listed`

### Sales Table

```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_id UUID REFERENCES nfts(id),
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),
  sale_price_hbar DECIMAL(20, 8) NOT NULL,
  sale_price_usd DECIMAL(20, 2),
  platform_fee_hbar DECIMAL(20, 8),
  artist_receives_hbar DECIMAL(20, 8),
  transaction_id VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_sales_nft` on `nft_id`
- `idx_sales_seller` on `seller_id`
- `idx_sales_buyer` on `buyer_id`

### User Favorites Table

```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, nft_id)
);
```

### Platform Settings Table

```sql
CREATE TABLE platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Running Migrations

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste `schema.sql`
5. Click **Run**

### Method 2: psql Command Line

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run schema
psql $DATABASE_URL -f backend/database/schema.sql
```

### Method 3: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref [YOUR-PROJECT-REF]

# Run migration
supabase db push --file backend/database/schema.sql
```

---

## Seeding Test Data

### What Gets Seeded

The `seed.sql` script creates:

- **7 Users:**
  - 1 Admin
  - 3 Artists (2 verified, 1 pending)
  - 3 Buyers

- **5 NFTs:**
  - 3 Listed for sale
  - 1 Sold
  - 1 Unlisted

- **1 Sale Transaction**

- **9 Favorites**

- **8 Platform Settings**

### How to Seed

#### Option 1: Supabase Dashboard

1. Go to **SQL Editor**
2. Create new query
3. Paste `seed.sql` contents
4. Click **Run**

#### Option 2: Command Line

```bash
psql $DATABASE_URL -f backend/database/seed.sql
```

### Verify Seed Data

```bash
cd backend
pnpm db:test
```

You should see:
```
✅ Seed Data Check (XXms)
```

---

## Testing Connection

### Automated Test Script

```bash
cd backend
pnpm db:test
```

This runs 13 comprehensive tests:

1. ✅ Environment Variables
2. ✅ Basic Connection
3. ✅ Users Table Schema
4. ✅ Artists Table Schema
5. ✅ NFTs Table Schema
6. ✅ Sales Table Schema
7. ✅ User Favorites Table Schema
8. ✅ Platform Settings Table Schema
9. ✅ Seed Data Check
10. ✅ Foreign Key Relationships
11. ✅ Write Permission Test
12. ✅ Update Permission Test
13. ✅ Connection Pool Info

**Expected Output:**

```
╔═══════════════════════════════════════╗
║  AfriArt Database Connection Test    ║
╚═══════════════════════════════════════╝

✅ Environment Variables (5ms)
✅ Basic Connection (123ms)
✅ Users Table Schema (45ms)
...

╔═══════════════════════════════════════╗
║          Test Summary                 ║
╚═══════════════════════════════════════╝

Total Tests:    13
✅ Passed:      13
❌ Failed:      0
⏱️  Avg Time:    67.23ms

╔═══════════════════════════════════════╗
║       Database Statistics             ║
╚═══════════════════════════════════════╝

Users:          7
Artists:        3
NFTs:           5
Sales:          1
```

### Manual Test

```typescript
// backend/src/test-connection.ts
import { supabase } from './config/database';

async function test() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Connection failed:', error);
  } else {
    console.log('✅ Connected! Users found:', data.length);
  }
}

test();
```

Run:
```bash
npx tsx backend/src/test-connection.ts
```

---

## Connection Pooling

### How It Works

Supabase automatically handles connection pooling via **PgBouncer**:

- **Default Pool Size:** 60 connections (free tier)
- **Transaction Mode:** Default pooling mode
- **Automatic Scaling:** Managed by Supabase

### Configuration

The backend is already configured with optimal settings:

```typescript
// backend/src/config/database.ts
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'afriart-backend'
    }
  }
});
```

### Monitoring Connection Usage

In Supabase Dashboard:
1. Go to **Database** → **Connection Pooling**
2. View real-time connection stats
3. Adjust pool size if needed (paid plans)

### For High Load

If you need more than 60 connections:

1. **Upgrade Supabase Plan**
   - Pro: 200 connections
   - Team: 400 connections

2. **Use Connection Pooler Endpoint**
   ```bash
   # Add :6543 to your database URL
   SUPABASE_URL=https://xxxxx.supabase.co:6543
   ```

3. **Implement Request Queuing**
   - Use a queue system (Bull, BullMQ)
   - Rate limit API requests
   - Implement caching (Redis)

---

## Troubleshooting

### Issue 1: "relation does not exist"

**Problem:** Table not found error

**Solution:**
```bash
# Run schema migration again
# In Supabase SQL Editor, execute schema.sql
```

### Issue 2: "permission denied for table"

**Problem:** Using anon key instead of service key

**Solution:**
```bash
# In backend/.env, use service key not anon key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUz...  # service_role key
```

### Issue 3: Connection timeout

**Problem:** Network or firewall blocking connection

**Solution:**
```bash
# 1. Check if URL is correct
echo $SUPABASE_URL

# 2. Test connection
curl https://xxxxx.supabase.co/rest/v1/

# 3. Check firewall settings
```

### Issue 4: "too many connections"

**Problem:** Exceeded connection pool limit

**Solution:**
1. Check active connections in Supabase dashboard
2. Close unused connections
3. Upgrade plan for more connections
4. Implement connection pooling optimization

### Issue 5: Foreign key constraint violation

**Problem:** Trying to insert data with invalid references

**Solution:**
```sql
-- Check if referenced record exists
SELECT id FROM users WHERE wallet_address = '0.0.12345';

-- Insert user first, then related data
INSERT INTO users (...) VALUES (...);
INSERT INTO artists (user_id, ...) VALUES ((SELECT id FROM users WHERE wallet_address = '0.0.12345'), ...);
```

### Issue 6: Seed script fails

**Problem:** Data already exists or constraint violations

**Solution:**
```sql
-- Clear all data first
TRUNCATE TABLE user_favorites, sales, nfts, artists, users, platform_settings CASCADE;

-- Then run seed.sql again
```

---

## Useful Queries

### Count Records by Table

```sql
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'artists', COUNT(*) FROM artists
UNION ALL SELECT 'nfts', COUNT(*) FROM nfts
UNION ALL SELECT 'sales', COUNT(*) FROM sales
UNION ALL SELECT 'favorites', COUNT(*) FROM user_favorites;
```

### View All NFTs with Creator Names

```sql
SELECT
  n.title,
  n.price_hbar,
  n.is_listed,
  c.display_name as creator_name,
  o.display_name as owner_name
FROM nfts n
LEFT JOIN users c ON n.creator_id = c.id
LEFT JOIN users o ON n.owner_id = o.id
ORDER BY n.created_at DESC;
```

### Artist Verification Status

```sql
SELECT
  u.display_name,
  u.email,
  a.verification_status,
  a.submitted_at,
  a.verified_at
FROM users u
INNER JOIN artists a ON u.id = a.user_id
ORDER BY a.submitted_at DESC;
```

### Sales Analytics

```sql
SELECT
  DATE(created_at) as sale_date,
  COUNT(*) as total_sales,
  SUM(sale_price_hbar) as total_volume_hbar,
  AVG(sale_price_hbar) as avg_price_hbar
FROM sales
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;
```

---

## Database Backup

### Manual Backup (Supabase Dashboard)

1. Go to **Database** → **Backups**
2. Click **Create Backup**
3. Download backup file

### Automated Backups

Supabase automatically backs up your database:
- **Free Tier:** Daily backups (7-day retention)
- **Pro Tier:** Daily backups (30-day retention)
- **Team Tier:** Daily backups (90-day retention)

### Restore from Backup

1. Go to **Database** → **Backups**
2. Select backup to restore
3. Click **Restore**

---

## Next Steps

1. ✅ **Schema Created** → Proceed to Week 2 (Authentication)
2. ✅ **Seed Data Loaded** → Test frontend integration
3. ✅ **Connection Tested** → Start building features
4. 📝 **Monitor Usage** → Check connection pool stats

---

## Resources

- **Supabase Docs:** https://supabase.com/docs/guides/database
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **PgBouncer:** https://www.pgbouncer.org/
- **SQL Tutorial:** https://www.postgresqltutorial.com/

---

**Status:** ✅ Database Setup Complete
**Last Updated:** 2025-10-25
