# AfriArt MVP Plan (8-10 Weeks)

## Mission
Launch a functional NFT marketplace where African artists can mint and sell their artwork, and buyers can purchase NFTs with HBAR. Focus on core minting and direct sales functionality, deferring auctions and physical copies to Phase 2.

---

## MVP Scope

### ✅ **In Scope** (MVP)
- NFT minting (HIP-412 standard) with IPFS storage
- Direct sales (buy now) only
- Wallet connection (HashPack/Blade)
- Artist verification (simple KYC document upload)
- Gallery/marketplace with filtering
- User profiles and dashboards
- Basic admin panel for artist approval

### ❌ **Out of Scope** (Post-MVP / Phase 2)
- Auctions and bidding system
- Physical copy orders and escrow
- Secondary market trading
- Advanced analytics
- Mobile app
- Email notifications (optional)

---

## Technology Stack (Simplified)

### Frontend
- Next.js 14 (existing)
- React 18
- Tailwind CSS + Shadcn UI
- Hedera Wallet Connect

### Backend
- Node.js + Express.js
- TypeScript
- @hashgraph/sdk (Hedera)
- Pinata (IPFS)
- Socket.io (optional for MVP)

### Database
- Supabase (PostgreSQL)
- Direct SQL queries (no ORM for speed)

### Blockchain
- Hedera Testnet
- Hedera Token Service (HTS)
- HIP-412 NFT standard

---

## Simplified Database Schema (MVP)

```sql
-- Users table
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

-- Artists table (minimal for MVP)
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  kyc_documents JSONB DEFAULT '[]', -- Array of IPFS URLs
  portfolio_urls JSONB DEFAULT '[]', -- Array of image URLs
  submitted_at TIMESTAMP,
  verified_at TIMESTAMP
);

-- NFTs table
CREATE TABLE nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id VARCHAR(100) UNIQUE NOT NULL, -- Hedera token ID
  serial_number INTEGER,
  creator_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),

  title VARCHAR(200) NOT NULL,
  description TEXT,
  art_technique VARCHAR(50),
  art_material VARCHAR(50),

  image_url TEXT NOT NULL,
  image_ipfs_cid VARCHAR(100),
  metadata_url TEXT,
  metadata_ipfs_cid VARCHAR(100),
  file_type VARCHAR(20),
  file_size_bytes BIGINT,

  price_hbar DECIMAL(20, 8),
  price_usd DECIMAL(20, 2),
  is_listed BOOLEAN DEFAULT TRUE,

  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  minted_at TIMESTAMP,

  CONSTRAINT valid_price CHECK (price_hbar IS NULL OR price_hbar > 0)
);

-- Sales table (for direct purchases only)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_id UUID REFERENCES nfts(id),
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),

  sale_price_hbar DECIMAL(20, 8) NOT NULL,
  sale_price_usd DECIMAL(20, 2),
  platform_fee_hbar DECIMAL(20, 8),

  transaction_id VARCHAR(100), -- Hedera transaction ID

  created_at TIMESTAMP DEFAULT NOW()
);

-- Favorites table
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, nft_id)
);

-- Platform settings
CREATE TABLE platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_nfts_creator ON nfts(creator_id);
CREATE INDEX idx_nfts_owner ON nfts(owner_id);
CREATE INDEX idx_nfts_listed ON nfts(is_listed) WHERE is_listed = TRUE;
CREATE INDEX idx_sales_buyer ON sales(buyer_id);
CREATE INDEX idx_sales_seller ON sales(seller_id);
```

---

## 8-Week Implementation Plan

### **Week 1: Foundation & Setup**

#### Monday-Tuesday: Backend Infrastructure
- [x] Initialize backend project (Express + TypeScript)
- [x] Set up project structure (controllers, services, routes, middleware)
- [x] Configure environment variables
- [x] Set up CORS, error handling, logging
- [x] Create health check endpoint

#### Wednesday-Thursday: Database Setup
- [x] Create Supabase project
- [x] Run database migration scripts
- [x] Create seed data script
- [x] Test database connections
- [x] Set up connection pooling

#### Friday: Hedera Integration Basics
- [x] Set up Hedera Testnet account
- [x] Fund account with test HBAR
- [x] Create Hedera client service
- [x] Test basic account balance query
- [x] Test simple HBAR transfer

**Deliverable**: Backend server running, database ready, Hedera connected

---

### **Week 2: User Management & Authentication**

#### Monday-Tuesday: Wallet Authentication
- [x] Implement wallet signature verification
- [x] Create JWT token generation
- [x] Build auth middleware
- [x] Create `/api/auth/connect` endpoint
- [x] Create `/api/auth/verify` endpoint

#### Wednesday-Thursday: User & Artist Endpoints
- [x] `POST /api/users/register` - Create user profile
- [x] `GET /api/users/:walletAddress` - Get profile
- [x] `PATCH /api/users/:walletAddress` - Update profile
- [x] `POST /api/artists/submit-verification` - Submit KYC
- [x] `GET /api/artists/:id` - Get artist details

#### Friday: Frontend Integration
- [x] Update WalletProvider to use real Hedera connection
- [x] Implement real wallet connect flow
- [x] Store JWT in localStorage
- [x] Add auth headers to API requests
- [x] Test user registration flow

**Deliverable**: Users can connect wallet, create profile, submit artist verification

---

### **Week 3: IPFS Integration & File Upload**

#### Monday-Tuesday: IPFS Service Setup
- [x] Create Pinata account
- [x] Set up Pinata API keys
- [x] Create IPFS service module
- [x] Implement file upload to IPFS
- [x] Implement metadata upload to IPFS
- [x] Test file retrieval

#### Wednesday: File Upload Endpoint
- [x] Create `/api/upload/file` endpoint
- [x] Add file validation (type, size)
- [x] Add virus scanning (optional but recommended)
- [x] Return IPFS CID and gateway URL

#### Thursday-Friday: Frontend File Upload
- [x] Update CreateNFTModal to upload file to backend
- [x] Show upload progress
- [x] Handle upload errors
- [x] Display uploaded file preview

**Deliverable**: Files can be uploaded to IPFS through the app

---

### **Week 4: NFT Minting (Core Feature)**

#### Monday-Tuesday: Hedera NFT Setup
- [x] Create AfriArt NFT collection token on Hedera
- [x] Configure token properties (name, symbol, supply key)
- [x] Save collection token ID to database
- [x] Create HIP-412 metadata generator
- [x] Test metadata structure

#### Wednesday-Thursday: Minting Service
- [x] Create NFT minting service
- [x] Implement minting workflow:
  1. Upload image to IPFS
  2. Generate HIP-412 metadata JSON
  3. Upload metadata to IPFS
  4. Mint NFT on Hedera with metadata CID
  5. Save NFT to database with token ID + serial
- [x] Handle minting errors
- [x] Add transaction verification

#### Friday: Minting API
- [x] Create `POST /api/nfts/mint` endpoint
- [x] Validate request data
- [x] Call minting service
- [x] Return minted NFT details
- [x] Update frontend CreateNFTModal to use real minting

**Deliverable**: Artists can mint real NFTs on Hedera Testnet

---

### **Week 5: Marketplace & Gallery**

#### Monday-Tuesday: NFT Listing API
- [x] Create `GET /api/nfts` - List all NFTs with filters
  - Query params: technique, material, priceMin, priceMax, search
  - Pagination support
  - Sorting options
- [x] Create `GET /api/nfts/:id` - Get single NFT
- [x] Create `PATCH /api/nfts/:id/list` - List/unlist NFT for sale
- [x] Create `PATCH /api/nfts/:id/price` - Update price

#### Wednesday-Thursday: Frontend Gallery Integration
- [x] Update Gallery component to fetch real NFTs
- [x] Implement filtering with API calls
- [x] Add pagination
- [x] Add loading states
- [x] Add error handling

#### Friday: NFT Detail Page
- [x] Create `/nft/[id]` page
- [x] Show full NFT details
- [x] Show creator information
- [x] Show transaction history (from Hedera Mirror Node)
- [x] Add "Buy Now" button

**Deliverable**: Marketplace shows real NFTs, users can browse and filter

---

### **Week 6: Direct Sales & Payments**

#### Monday-Tuesday: Purchase Flow Backend
- [x] Create `POST /api/nfts/:id/purchase` endpoint
- [x] Implement purchase workflow:
  1. Verify NFT is listed and price hasn't changed
  2. Verify buyer has sufficient HBAR
  3. Calculate platform fee (2%)
  4. Initiate HBAR transfer (buyer → platform treasury)
  5. Transfer NFT (seller → buyer)
  6. Distribute funds (98% to seller, 2% to platform)
  7. Update NFT owner in database
  8. Create sale record
- [x] Handle transaction failures
- [x] Add idempotency (prevent double purchase)

#### Wednesday-Thursday: Transaction Verification
- [x] Integrate Hedera Mirror Node API
- [x] Verify transaction status
- [x] Wait for consensus (3-5 seconds)
- [x] Update sale status based on confirmation

#### Friday: Frontend Purchase Integration
- [x] Update PurchaseModal to call real API
- [x] Show transaction signing prompt
- [x] Show transaction pending state
- [x] Show transaction success/failure
- [x] Redirect to "My Collection" on success

**Deliverable**: Users can purchase NFTs with HBAR, NFTs transfer to buyer

---

### **Week 7: Artist Verification & Admin Panel**

#### Monday-Tuesday: Admin Endpoints
- [x] Create `GET /api/admin/pending-verifications` - List pending artists
- [x] Create `PATCH /api/admin/artists/:id/approve` - Approve artist
- [x] Create `PATCH /api/admin/artists/:id/reject` - Reject artist
- [x] Create `GET /api/admin/stats` - Platform statistics
- [x] Add admin role check middleware

#### Wednesday-Thursday: Admin Frontend
- [x] Create `/admin` page (route guard)
- [x] Show pending artist verifications
- [x] Display KYC documents (IPFS links)
- [x] Show portfolio samples
- [x] Add approve/reject buttons
- [x] Show platform stats dashboard

#### Friday: Email Notifications (Optional)
- [ ] Set up SMTP (Gmail/SendGrid)
- [ ] Send welcome email on registration
- [ ] Send verification status email to artists
- [ ] Send sale confirmation emails

**Deliverable**: Admin can review and approve/reject artists

---

### **Week 8: Testing, Polish & Deployment**

#### Monday-Tuesday: Critical Improvements from UI Review
- [x] Fix file size limits (50MB/200MB)
- [x] Add mobile menu to Navbar
- [x] Add structured address form (for Phase 2)
- [x] Add loading states across all operations
- [x] Add error handling with Toast notifications
- [x] Fix TypeScript strict mode errors

#### Wednesday: Testing
- [x] End-to-end testing (Playwright)
  - User registration flow
  - Artist verification flow
  - NFT minting flow
  - NFT purchase flow
- [x] Integration testing (API endpoints)
- [x] Manual testing on Hedera Testnet

#### Thursday: Deployment Prep
- [x] Set up Vercel project for frontend
- [x] Deploy backend to Railway/Render
- [x] Set up production database
- [x] Configure production environment variables
- [x] Set up monitoring (Sentry)

#### Friday: Testnet Beta Launch
- [x] Deploy to production
- [x] Invite 5-10 beta testers (artists)
- [x] Monitor for bugs
- [x] Collect feedback
- [x] Create bug fixes backlog

**Deliverable**: Fully functional MVP on Hedera Testnet

---

## Optional: Week 9-10 (Buffer/Enhancements)

If you have extra time or want to polish before launching:

### Week 9: Price Conversion & Enhanced UX
- [x] Integrate CoinGecko API for HBAR/USD conversion
- [x] Show USD prices throughout app
- [x] Add price range filter to Gallery
- [x] Add user statistics to Dashboard
- [x] Add notifications bell (in-app only)

### Week 10: Performance & SEO
- [x] Add image optimization (Next.js Image)
- [x] Implement component memoization
- [x] Add meta tags for SEO
- [x] Create sitemap
- [x] Performance audit (Lighthouse)
- [x] Accessibility audit

---

## MVP Feature Checklist

### User Features
- [x] Connect Hedera wallet (HashPack/Blade)
- [x] Create user profile
- [x] Browse NFT gallery
- [x] Filter NFTs (technique, material, price)
- [x] Search NFTs
- [x] View NFT details
- [x] Favorite NFTs
- [x] Purchase NFTs with HBAR
- [x] View owned NFTs
- [x] View purchase history

### Artist Features
- [x] Register as artist
- [x] Submit KYC documents
- [x] Upload portfolio samples
- [x] Mint NFTs (HIP-412 standard)
- [x] Set NFT price
- [x] List/unlist NFTs for sale
- [x] View created NFTs
- [x] View sales history
- [x] View earnings

### Admin Features
- [x] View pending artist verifications
- [x] Review KYC documents
- [x] Approve/reject artists
- [x] View platform statistics
- [x] Monitor sales activity

### Technical Features
- [x] Wallet signature authentication
- [x] IPFS file upload (images + videos)
- [x] HIP-412 metadata generation
- [x] NFT minting on Hedera
- [x] HBAR transfers
- [x] Platform fee collection (2%)
- [x] Transaction verification (Mirror Node)
- [x] Error handling
- [x] Loading states

---

## API Endpoints (MVP)

### Authentication
- `POST /api/auth/connect` - Initiate wallet connection
- `POST /api/auth/verify` - Verify signature and issue JWT

### Users
- `POST /api/users/register` - Create user profile
- `GET /api/users/:walletAddress` - Get user profile
- `PATCH /api/users/:walletAddress` - Update user profile

### Artists
- `POST /api/artists/submit-verification` - Submit KYC
- `GET /api/artists/:id` - Get artist details
- `GET /api/artists` - List all verified artists

### NFTs
- `POST /api/nfts/mint` - Mint new NFT
- `GET /api/nfts` - List NFTs (with filters)
- `GET /api/nfts/:id` - Get NFT details
- `PATCH /api/nfts/:id/list` - List/unlist for sale
- `PATCH /api/nfts/:id/price` - Update price
- `POST /api/nfts/:id/purchase` - Purchase NFT

### Upload
- `POST /api/upload/file` - Upload file to IPFS
- `POST /api/upload/metadata` - Upload metadata to IPFS

### Favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:nftId` - Remove from favorites
- `GET /api/favorites` - Get user's favorites

### Admin
- `GET /api/admin/pending-verifications` - List pending artists
- `PATCH /api/admin/artists/:id/approve` - Approve artist
- `PATCH /api/admin/artists/:id/reject` - Reject artist
- `GET /api/admin/stats` - Platform statistics

---

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Backend (.env)
```bash
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000

DATABASE_URL=postgresql://...
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=...

HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=...
HEDERA_NFT_COLLECTION_ID=0.0.xxxxx

IPFS_PROVIDER=pinata
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

JWT_SECRET=...
JWT_EXPIRATION=7d

COINGECKO_API_URL=https://api.coingecko.com/api/v3
```

---

## Success Metrics (MVP Launch)

### Week 1 Targets
- 10+ verified artists
- 50+ NFTs minted
- 20+ sales completed

### Week 4 Targets
- 25+ verified artists
- 150+ NFTs minted
- 50+ sales completed
- $500+ in sales volume

### Week 8 Targets
- 50+ verified artists
- 300+ NFTs minted
- 100+ active buyers
- $2,000+ in sales volume

---

## Post-MVP Roadmap (Phase 2)

Once MVP is stable and has users, add:

1. **Auctions & Bidding** (2-3 weeks)
   - Auction creation and management
   - Real-time bidding with WebSocket
   - Auction settlement

2. **Physical Copy Orders** (2-3 weeks)
   - Escrow smart contracts
   - Physical order flow
   - Shipping management

3. **Secondary Market** (2 weeks)
   - Resale functionality
   - Royalty enforcement

4. **Enhanced Features** (Ongoing)
   - Email notifications
   - Advanced analytics
   - Collection/series minting
   - Social features

---

## Risk Mitigation (MVP)

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Hedera testnet limits | Monitor rate limits, implement queuing |
| IPFS gateway downtime | Use multiple gateways (Pinata + public) |
| Database connection pool | Configure max connections, implement retries |
| File upload failures | Add retry logic, chunked uploads for large files |
| Transaction failures | Implement idempotency, transaction verification |

### Business Risks
| Risk | Mitigation |
|------|------------|
| Low artist adoption | Reach out to African artist communities |
| Quality control | KYC verification process |
| Pricing complexity | Fix platform fee at 2%, clear pricing display |
| User confusion | Tooltips, help documentation, onboarding flow |

---

## Next Immediate Actions (Start Today!)

1. **Initialize Backend** (2 hours)
   ```bash
   mkdir backend
   cd backend
   npm init -y
   npm install express typescript @types/express @types/node
   npm install ts-node nodemon
   npm install dotenv cors helmet express-validator
   npm install @hashgraph/sdk
   npm install @supabase/supabase-js
   # Create basic server structure
   ```

2. **Set Up Supabase** (1 hour)
   - Create project at supabase.com
   - Run database schema SQL
   - Get connection URL and keys
   - Test connection

3. **Set Up Hedera Testnet** (1 hour)
   - Create account at portal.hedera.com
   - Get testnet credentials
   - Fund with test HBAR
   - Test basic query

4. **Set Up Pinata** (30 minutes)
   - Create account at pinata.cloud
   - Get API keys
   - Test file upload

**Total Time to Start**: ~4.5 hours

You can have the foundation running **TODAY**! Let's get started! 🚀
