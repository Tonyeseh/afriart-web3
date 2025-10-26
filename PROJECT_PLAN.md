# AfriArt Web3 NFT Marketplace - Implementation Plan

## Project Overview

**Mission**: Bridge the gap between African artists and the global marketplace through Web3 technology.

**Core Value Proposition**: Enable African artists to mint, sell, and auction their artwork as NFTs on the Hedera network, with optional physical copy fulfillment.

---

## Technical Foundation

### Blockchain Layer
- **Network**: Hedera Hashgraph (Testnet → Mainnet)
- **Token Standard**: HIP-412 (Hedera NFT Standard)
- **Token Service**: Hedera Token Service (HTS)
- **Smart Contracts**: Hedera Smart Contract Service (HSCS) for escrow
- **Wallet Integration**: HashPack, Blade Wallet via WalletConnect

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Framework**: Shadcn UI + Radix UI, Tailwind CSS
- **Backend**: Node.js dedicated server (Express/Fastify)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: IPFS (via Pinata or NFT.Storage)
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js 14)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Gallery    │  │   Auction    │  │  User Dashboard │  │
│  │   Browsing   │  │   Interface  │  │   (Portfolio)   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                          ▲                                  │
│                          │ REST API / WebSocket            │
└──────────────────────────┼─────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                  BACKEND SERVER (Node.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  API Routes  │  │  NFT Service │  │  Auction Engine │  │
│  │  (Express)   │  │   (Minting)  │  │  (Bidding Logic)│  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │Escrow Service│  │ File Service │  │ Webhook Handler │  │
│  │  (Physical)  │  │    (IPFS)    │  │  (Hedera Mirror)│  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└──────────────────────────┼─────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                   DATA & STORAGE LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Supabase   │  │     IPFS     │  │  Hedera Mirror  │  │
│  │  (Postgres)  │  │  (NFT.Storage│  │   Node API      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                    HEDERA NETWORK                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Token Service│  │Smart Contract│  │  Consensus Node │  │
│  │ (HTS - NFTs) │  │(Escrow/Auction│  │   (Validation)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- Users/Profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(50) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'artist', 'admin')),
  display_name VARCHAR(100),
  email VARCHAR(255),
  bio TEXT,
  profile_picture_url TEXT,
  cover_image_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Artist-specific data
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  kyc_submitted_at TIMESTAMP,
  kyc_document_urls JSONB DEFAULT '[]',
  portfolio_urls JSONB DEFAULT '[]',
  primary_technique VARCHAR(50),
  nft_count INTEGER DEFAULT 0,
  total_sales_hbar DECIMAL(20, 8) DEFAULT 0,
  total_sales_usd DECIMAL(20, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 4) DEFAULT 0.02, -- 2% platform fee
  verified_at TIMESTAMP,
  UNIQUE(user_id)
);

-- NFT Collections
CREATE TABLE nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id VARCHAR(100) UNIQUE NOT NULL, -- Hedera Token ID (0.0.xxxxx)
  serial_number INTEGER, -- NFT serial number from HTS
  creator_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL, -- IPFS CID/URL
  image_ipfs_cid VARCHAR(100),
  metadata_url TEXT, -- IPFS metadata JSON
  metadata_ipfs_cid VARCHAR(100),
  art_technique VARCHAR(50),
  art_material VARCHAR(50),
  file_type VARCHAR(20), -- image/video
  file_size_bytes BIGINT,

  -- Pricing
  listing_type VARCHAR(20) CHECK (listing_type IN ('sale', 'auction', 'not_listed')),
  price_hbar DECIMAL(20, 8),
  price_usd DECIMAL(20, 2), -- Snapshot at creation

  -- Physical copy
  has_physical_copy BOOLEAN DEFAULT FALSE,
  physical_copy_price_hbar DECIMAL(20, 8),
  physical_shipping_cost_hbar DECIMAL(20, 8) DEFAULT 25,
  physical_copies_sold INTEGER DEFAULT 0,

  -- Metadata
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  is_nsfw BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  minted_at TIMESTAMP,

  CONSTRAINT valid_price CHECK (price_hbar IS NULL OR price_hbar > 0)
);

-- Auctions
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id),

  starting_price_hbar DECIMAL(20, 8) NOT NULL,
  current_bid_hbar DECIMAL(20, 8),
  current_bidder_id UUID REFERENCES users(id),

  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_hours INTEGER NOT NULL, -- Artist configurable

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  winner_id UUID REFERENCES users(id),
  final_price_hbar DECIMAL(20, 8),

  bid_count INTEGER DEFAULT 0,
  minimum_bid_increment_hbar DECIMAL(20, 8) DEFAULT 1, -- Minimum increase per bid

  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_auction_times CHECK (end_time > start_time),
  CONSTRAINT valid_starting_price CHECK (starting_price_hbar > 0)
);

-- Bids
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES users(id),

  amount_hbar DECIMAL(20, 8) NOT NULL,
  amount_usd DECIMAL(20, 2), -- Snapshot at bid time

  is_winning BOOLEAN DEFAULT FALSE,
  is_outbid BOOLEAN DEFAULT FALSE,

  transaction_id VARCHAR(100), -- Hedera transaction ID

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_bid_amount CHECK (amount_hbar > 0)
);

-- Direct Sales/Purchases
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_id UUID REFERENCES nfts(id),
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),

  sale_price_hbar DECIMAL(20, 8) NOT NULL,
  sale_price_usd DECIMAL(20, 2),

  platform_fee_hbar DECIMAL(20, 8), -- 2% of sale price
  artist_receives_hbar DECIMAL(20, 8),

  transaction_id VARCHAR(100), -- Hedera transaction ID

  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Physical Copy Orders
CREATE TABLE physical_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_id UUID REFERENCES nfts(id),
  buyer_id UUID REFERENCES users(id),
  artist_id UUID REFERENCES users(id),

  -- Buyer contact details
  buyer_name VARCHAR(100),
  buyer_email VARCHAR(255),
  buyer_phone VARCHAR(50),
  shipping_address JSONB NOT NULL, -- {street, city, state, country, postal_code}

  -- Pricing
  nft_price_hbar DECIMAL(20, 8),
  physical_copy_price_hbar DECIMAL(20, 8),
  shipping_cost_hbar DECIMAL(20, 8),
  total_price_hbar DECIMAL(20, 8),

  -- Escrow
  escrow_contract_id VARCHAR(100), -- Smart contract address/ID
  escrow_transaction_id VARCHAR(100),
  escrow_amount_hbar DECIMAL(20, 8),
  escrow_status VARCHAR(20) DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'funded', 'released', 'refunded')),

  -- Order status
  order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN (
    'pending_artist_approval',
    'accepted',
    'declined',
    'in_production',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'disputed'
  )),

  -- Artist actions
  artist_accepted_at TIMESTAMP,
  artist_declined_at TIMESTAMP,
  decline_reason TEXT,
  decline_penalty_hbar DECIMAL(20, 8), -- Penalty if artist declines

  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Favorites/Watchlist
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, nft_id)
);

CREATE TABLE user_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, nft_id)
);

-- Activity/Transaction Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- 'mint', 'list', 'bid', 'purchase', 'transfer', etc.
  nft_id UUID REFERENCES nfts(id),
  auction_id UUID REFERENCES auctions(id),
  metadata JSONB DEFAULT '{}',
  hedera_transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Platform Settings
CREATE TABLE platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin moderation
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  target_type VARCHAR(20) CHECK (target_type IN ('nft', 'user', 'auction')),
  target_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'hide', 'flag_nsfw', 'ban_user', 'remove_listing'
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_nfts_creator ON nfts(creator_id);
CREATE INDEX idx_nfts_owner ON nfts(owner_id);
CREATE INDEX idx_nfts_listing_type ON nfts(listing_type);
CREATE INDEX idx_nfts_active ON nfts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_physical_orders_status ON physical_orders(order_status);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
```

---

## Implementation Phases

### **PHASE 1: Foundation & Infrastructure** (Week 1-2)

#### 1.1 Backend Server Setup
- [ ] Initialize Node.js backend project (Express/Fastify)
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Set up environment variables (.env management)
- [ ] Create project structure (controllers, services, routes, middleware)
- [ ] Set up CORS, rate limiting, error handling
- [ ] Configure logging (Winston/Pino)

#### 1.2 Database Setup
- [ ] Implement database schema in Supabase
- [ ] Create migration scripts
- [ ] Set up database connection pool
- [ ] Create seed data for testing
- [ ] Implement database backup strategy

#### 1.3 Hedera Integration Foundation
- [ ] Set up Hedera SDK (@hashgraph/sdk)
- [ ] Configure Hedera Testnet credentials (Operator Account)
- [ ] Create Hedera client service wrapper
- [ ] Implement account balance checking
- [ ] Test basic HBAR transfers

#### 1.4 IPFS Integration
- [ ] Set up IPFS provider account (Pinata or NFT.Storage)
- [ ] Create file upload service
- [ ] Implement file validation (type, size limits)
  - **Images**: Max 50MB (JPEG, PNG, GIF, WebP, SVG)
  - **Videos**: Max 200MB (MP4, WebM, MOV)
- [ ] Create metadata JSON generation
- [ ] Test file pinning and retrieval

---

### **PHASE 2: Core NFT Functionality** (Week 3-4)

#### 2.1 HIP-412 NFT Implementation
**What is HIP-412?**
HIP-412 is the Hedera Improvement Proposal for NFT metadata standards. It defines:
- Standard JSON schema for NFT metadata (compatible with OpenSea, etc.)
- IPFS-based storage for images and metadata
- Attributes, properties, and traits structure
- Royalty information encoding

**Implementation Steps:**
- [ ] Create NFT metadata generator (HIP-412 compliant)
- [ ] Implement NFT token creation via Hedera Token Service
  - Create NFT collection (single token ID for platform)
  - Mint individual NFTs as serial numbers
- [ ] Store token ID and serial in database
- [ ] Associate NFT with creator wallet
- [ ] Implement NFT transfer function

**Example HIP-412 Metadata:**
```json
{
  "name": "African Sunset #1",
  "creator": "Amara Okafor",
  "description": "Traditional acrylic painting...",
  "image": "ipfs://QmXxxx...",
  "type": "image/jpeg",
  "format": "HIP412@2.0.0",
  "properties": {
    "technique": "Acrylic Painting",
    "material": "Canvas",
    "hasPhysicalCopy": true,
    "artist": "0.0.123456"
  },
  "attributes": [
    {"trait_type": "Technique", "value": "Acrylic"},
    {"trait_type": "Material", "value": "Canvas"}
  ],
  "localization": {
    "uri": "ipfs://QmYyyy.../metadata.json",
    "default": "en"
  }
}
```

#### 2.2 Minting Service
- [ ] Create `POST /api/nfts/mint` endpoint
- [ ] File upload flow:
  1. Validate file (type, size)
  2. Upload to IPFS → get CID
  3. Generate HIP-412 metadata
  4. Upload metadata to IPFS → get metadata CID
  5. Call Hedera Token Service to mint NFT
  6. Store NFT data in database
- [ ] Handle minting errors and rollback
- [ ] Emit real-time minting status updates (WebSocket)

#### 2.3 NFT Listing & Browsing
- [ ] `GET /api/nfts` - List all NFTs with filters
  - Query params: technique, material, priceMin, priceMax, listingType, hasPhysical
  - Pagination support
  - Sorting (recent, price, popular)
- [ ] `GET /api/nfts/:id` - Get single NFT details
- [ ] `PATCH /api/nfts/:id` - Update NFT listing (price, listing type)
- [ ] Implement search functionality (title, description, creator)

#### 2.4 Direct Sales
- [ ] Create `POST /api/nfts/:id/purchase` endpoint
- [ ] Purchase flow:
  1. Verify buyer wallet has sufficient HBAR
  2. Calculate platform fee (2%)
  3. Initiate HBAR transfer (buyer → platform)
  4. Transfer NFT (seller → buyer)
  5. Distribute funds (platform fee → treasury, rest → seller)
  6. Update NFT owner in database
  7. Create sale record
- [ ] Transaction verification via Hedera Mirror Node
- [ ] Handle transaction failures and refunds

---

### **PHASE 3: Auction System** (Week 5-6)

#### 3.1 Auction Creation
- [ ] `POST /api/auctions` - Create auction
  - Input: nftId, startingPrice, durationHours
  - Validation: NFT owned by creator, not already listed
  - Lock NFT from direct sale
- [ ] Configurable auction duration (artist sets hours)
- [ ] Automatic auction start (immediate or scheduled)
- [ ] Update NFT listing_type to 'auction'

#### 3.2 Bidding Mechanism
- [ ] `POST /api/auctions/:id/bid` - Place bid
  - Validate bid > current highest bid + minimum increment
  - Hold bid amount in escrow (optional) or verify wallet balance
  - Refund previous highest bidder (if using escrow)
  - Update auction current_bid and current_bidder
  - Emit real-time bid event
- [ ] `GET /api/auctions/:id/bids` - Get bid history
- [ ] Automatic bid increment calculation (1 HBAR minimum)

#### 3.3 Auction Settlement
- [ ] Background job to monitor auction end times (cron job)
- [ ] Auction completion flow:
  1. Identify winner (highest bidder)
  2. Transfer NFT to winner
  3. Transfer HBAR to seller (minus 2% platform fee)
  4. Update auction status to 'completed'
  5. Create sale record
  6. Notify winner and seller
- [ ] Handle edge cases (no bids, tie bids, cancelled auctions)
- [ ] Implement auction cancellation (pre-bids only)

#### 3.4 Real-Time Updates
- [ ] Set up WebSocket server (Socket.io)
- [ ] Emit events:
  - `auction:newBid` - New bid placed
  - `auction:ending` - Auction ending in 5 minutes
  - `auction:ended` - Auction completed
- [ ] Frontend WebSocket client integration

---

### **PHASE 4: Physical Copy & Escrow** (Week 7-8)

#### 4.1 Escrow Smart Contract
**Why Smart Contracts for Escrow?**
Smart contracts provide trustless, automated escrow:
- Buyer funds locked on-chain until delivery confirmed
- No centralized custody of funds
- Transparent, auditable transactions
- Automatic refunds on order decline/dispute

**Hedera Smart Contract Implementation:**
- [ ] Write Solidity escrow contract:
  - `createEscrow(orderId, seller, amount)` - Buyer deposits HBAR
  - `releaseEscrow(orderId)` - Release funds to seller (on delivery)
  - `refundEscrow(orderId)` - Refund buyer (on cancellation)
  - `penalizeDecline(orderId, artist, penalty)` - Charge artist for decline
- [ ] Deploy contract to Hedera Testnet
- [ ] Create backend service to interact with contract
- [ ] Test escrow lifecycle

#### 4.2 Physical Order Flow
- [ ] `POST /api/physical-orders` - Create order
  - Input: nftId, buyerContactDetails, shippingAddress
  - Create physical_orders record
  - Call escrow contract to lock funds (NFT price + physical + shipping)
  - Set status: 'pending_artist_approval'
  - Notify artist

- [ ] `PATCH /api/physical-orders/:id/accept` - Artist accepts
  - Update status: 'accepted'
  - Release partial payment to artist (production advance)
  - Set deadline for shipment

- [ ] `PATCH /api/physical-orders/:id/decline` - Artist declines
  - Calculate penalty (e.g., 5% of order value)
  - Call escrow contract to refund buyer and charge artist penalty
  - Transfer NFT back to artist
  - Update status: 'declined'

- [ ] `PATCH /api/physical-orders/:id/ship` - Mark as shipped
  - Update status: 'shipped'
  - Record shipped_at timestamp

- [ ] `PATCH /api/physical-orders/:id/confirm-delivery` - Buyer confirms
  - Release escrow funds to artist
  - Update status: 'completed'
  - Transfer NFT to buyer (if not already done)

#### 4.3 Order Management
- [ ] `GET /api/physical-orders` - List orders (buyer/artist view)
- [ ] Email notifications for order status changes
- [ ] Admin override for dispute resolution
- [ ] Automatic delivery confirmation (30 days after shipping)

---

### **PHASE 5: User Management & Authentication** (Week 9-10)

#### 5.1 Wallet Authentication
- [ ] Implement wallet signature-based auth
  - User signs message with private key
  - Backend verifies signature
  - Issue JWT token for session
- [ ] Auth middleware for protected routes
- [ ] Role-based access control (buyer, artist, admin)

#### 5.2 User Profiles
- [ ] `POST /api/users/register` - Create profile
  - Input: walletAddress, role (buyer/artist)
  - Prevent duplicate roles for same wallet
- [ ] `GET /api/users/:walletAddress` - Get profile
- [ ] `PATCH /api/users/:walletAddress` - Update profile
  - Display name, bio, profile picture, social links
- [ ] Profile picture upload to IPFS

#### 5.3 Artist Verification
- [ ] `POST /api/artists/submit-kyc` - Submit verification
  - Upload KYC documents (ID, proof of address)
  - Upload portfolio samples (3-5 works)
  - Store in secure IPFS (encrypted or private gateway)
- [ ] Admin dashboard for KYC review
- [ ] `PATCH /api/artists/:id/verify` - Approve artist
- [ ] `PATCH /api/artists/:id/reject` - Reject with reason
- [ ] Email notifications for verification status

#### 5.4 User Dashboard
- [ ] `GET /api/users/:id/nfts` - Get owned NFTs
- [ ] `GET /api/users/:id/created-nfts` - Get created NFTs
- [ ] `GET /api/users/:id/bids` - Get bid history
- [ ] `GET /api/users/:id/sales` - Get sales history
- [ ] `GET /api/users/:id/favorites` - Get favorites
- [ ] `POST /api/users/:id/favorites` - Add favorite
- [ ] `DELETE /api/users/:id/favorites/:nftId` - Remove favorite

---

### **PHASE 6: Admin Panel & Moderation** (Week 11)

#### 6.1 Admin Authentication
- [ ] Admin role verification
- [ ] Separate admin dashboard route
- [ ] Multi-factor authentication (optional)

#### 6.2 Moderation Tools
- [ ] `GET /api/admin/pending-kyc` - List pending verifications
- [ ] `PATCH /api/admin/nfts/:id/hide` - Hide inappropriate NFT
- [ ] `PATCH /api/admin/nfts/:id/flag-nsfw` - Mark as NSFW
- [ ] `PATCH /api/admin/users/:id/ban` - Ban user
- [ ] `GET /api/admin/reports` - User-reported content (future)
- [ ] Activity log for admin actions

#### 6.3 Platform Analytics
- [ ] Total NFTs minted
- [ ] Total sales volume (HBAR/USD)
- [ ] Active auctions count
- [ ] Platform fee revenue
- [ ] User growth metrics
- [ ] Top artists by sales

---

### **PHASE 7: Frontend Integration** (Week 12-14)

#### 7.1 Wallet Connection Enhancement
- [ ] Replace mock wallet connection with real Hedera wallet
- [ ] Support HashPack, Blade Wallet
- [ ] Implement WalletConnect v2 integration
- [ ] Display real wallet balance
- [ ] Network switching (Testnet/Mainnet)

#### 7.2 NFT Minting UI
- [ ] Connect CreateNFTModal to real API
- [ ] File upload to IPFS (client-side or backend)
- [ ] Real-time minting progress
- [ ] Transaction signing flow
- [ ] Success state with token ID display
- [ ] Error handling and user feedback

#### 7.3 Gallery & Marketplace
- [ ] Connect Gallery to real NFT API
- [ ] Implement filtering with API calls
- [ ] Lazy loading/pagination
- [ ] Real-time price updates (HBAR/USD)
- [ ] Add to favorites/watchlist functionality

#### 7.4 Purchase & Bidding
- [ ] Connect PurchaseModal to API
- [ ] Transaction signing for purchases
- [ ] Bid placement with real-time updates
- [ ] WebSocket integration for live auction updates
- [ ] Physical order form integration

#### 7.5 User Dashboard
- [ ] Connect UserDashboard to real user API
- [ ] Display owned NFTs from blockchain
- [ ] Show created NFTs with minting status
- [ ] Physical order tracking UI
- [ ] Bid history with status updates
- [ ] Profile editing with IPFS upload

#### 7.6 Artist Verification Flow
- [ ] KYC document upload form
- [ ] Portfolio submission interface
- [ ] Verification status display
- [ ] Artist badge on verified profiles

#### 7.7 Admin Dashboard
- [ ] Create admin-only routes
- [ ] KYC review interface
- [ ] Moderation actions UI
- [ ] Analytics dashboard with charts
- [ ] Platform settings management

---

### **PHASE 8: Testing & Quality Assurance** (Week 15-16)

#### 8.1 Unit Testing
- [ ] Backend service unit tests (Jest)
- [ ] Smart contract tests (Hardhat)
- [ ] Frontend component tests (React Testing Library)
- [ ] Utility function tests

#### 8.2 Integration Testing
- [ ] API endpoint integration tests
- [ ] Hedera transaction tests (Testnet)
- [ ] IPFS upload/retrieval tests
- [ ] Database query tests
- [ ] Escrow contract integration tests

#### 8.3 End-to-End Testing
- [ ] User registration flow (Playwright/Cypress)
- [ ] NFT minting flow
- [ ] Purchase flow
- [ ] Auction bidding flow
- [ ] Physical order flow
- [ ] Admin moderation flow

#### 8.4 Security Audit
- [ ] Smart contract audit (internal or external)
- [ ] API security review
- [ ] SQL injection prevention
- [ ] XSS/CSRF protection
- [ ] Rate limiting effectiveness
- [ ] Authentication/authorization review

#### 8.5 Performance Testing
- [ ] Load testing (Artillery/k6)
- [ ] Database query optimization
- [ ] IPFS retrieval performance
- [ ] Frontend bundle size optimization
- [ ] Lighthouse performance audit

---

### **PHASE 9: Deployment & Launch Preparation** (Week 17-18)

#### 9.1 Infrastructure Setup
- [ ] Set up Vercel project for frontend
- [ ] Deploy backend to Railway/Render
- [ ] Configure production database (Supabase)
- [ ] Set up IPFS pinning service (production)
- [ ] Configure CDN for static assets

#### 9.2 Environment Configuration
- [ ] Production environment variables
- [ ] Hedera Mainnet credentials (treasury account)
- [ ] API keys and secrets management
- [ ] CORS whitelist configuration
- [ ] Rate limiting rules

#### 9.3 Monitoring & Logging
- [ ] Set up error tracking (Sentry)
- [ ] Application monitoring (New Relic/DataDog)
- [ ] Log aggregation (Logtail/Papertrail)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Hedera transaction monitoring (Mirror Node webhooks)

#### 9.4 Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guides (minting, buying, selling)
- [ ] Artist onboarding guide
- [ ] FAQ section
- [ ] Terms of Service & Privacy Policy

#### 9.5 Testnet Beta Launch
- [ ] Deploy to Testnet
- [ ] Invite beta testers (10-20 artists)
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Performance tuning

---

### **PHASE 10: Mainnet Launch & Post-Launch** (Week 19-20)

#### 10.1 Mainnet Migration
- [ ] Deploy smart contracts to Mainnet
- [ ] Configure Mainnet Hedera credentials
- [ ] Update frontend to Mainnet RPC
- [ ] Migrate essential data (if any)
- [ ] Final security review

#### 10.2 Launch Checklist
- [ ] Marketing website ready
- [ ] Social media accounts active
- [ ] Launch announcement prepared
- [ ] Customer support channels (Discord, Telegram)
- [ ] Payment processing tested
- [ ] Backup/disaster recovery plan

#### 10.3 Post-Launch Monitoring
- [ ] 24/7 system monitoring (first week)
- [ ] Rapid response to bugs
- [ ] User support queue
- [ ] Transaction monitoring
- [ ] Performance metrics tracking

#### 10.4 Iteration & Improvement
- [ ] User feedback collection
- [ ] Feature request tracking
- [ ] Bug prioritization
- [ ] Weekly deployment cycle
- [ ] Monthly feature releases

---

## Future Iterations (Post-MVP)

### Iteration 2: Enhanced Features
- [ ] Artist application/approval workflow
- [ ] Shipping carrier tracking integration
- [ ] Thumbnail generation for images/videos
- [ ] Video preview/streaming optimization
- [ ] Reserve prices for auctions
- [ ] Buy-now option during auctions
- [ ] Offer/counter-offer negotiation
- [ ] NFT collections (series minting)

### Iteration 3: Advanced Marketplace
- [ ] Secondary market trading
- [ ] Royalty enforcement (creator gets % on resales)
- [ ] Fractional NFT ownership
- [ ] NFT bundles/collections
- [ ] Rarity scoring and traits filtering
- [ ] Advanced analytics for artists
- [ ] Referral/affiliate program

### Iteration 4: Community Features
- [ ] User messaging system
- [ ] Artist collaboration tools
- [ ] Social feed (activity updates)
- [ ] Comments on NFTs
- [ ] User ratings/reviews
- [ ] Community governance (DAO)

### Iteration 5: Global Expansion
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Fiat payment integration (Stripe/credit cards)
- [ ] Multi-currency pricing
- [ ] Localization (French, Swahili, Arabic)
- [ ] Regional shipping optimization
- [ ] Tax compliance automation

---

## Technical Decisions Explained

### 1. Why Hedera Token Service (HTS) instead of Smart Contracts for NFTs?

**Advantages of HTS:**
- **Cost-effective**: Fixed fee ($1 USD) to create NFT collection, $0.001 per mint
- **Faster**: 3-5 second finality vs. 12+ seconds on Ethereum
- **Built-in**: No need to write/audit custom NFT smart contracts
- **HIP-412 compliant**: Native support for NFT metadata standard
- **Energy efficient**: Hedera's carbon-negative network
- **Royalty support**: Built-in royalty features

**Implementation:**
```javascript
// Create NFT collection (one-time)
const nftCreate = await new TokenCreateTransaction()
  .setTokenName("AfriArt NFT Collection")
  .setTokenSymbol("AFRI")
  .setTokenType(TokenType.NonFungibleUnique)
  .setDecimals(0)
  .setInitialSupply(0)
  .setTreasuryAccountId(treasuryId)
  .setSupplyKey(supplyKey)
  .execute(client);

// Mint individual NFT
const mintTx = await new TokenMintTransaction()
  .setTokenId(tokenId)
  .setMetadata([Buffer.from(metadataIPFSCID)])
  .execute(client);
```

### 2. Why Dedicated Backend Server instead of Edge Functions?

**Reasons:**
- **Complex business logic**: Auction monitoring, escrow management
- **Long-running processes**: Background jobs, cron tasks
- **WebSocket support**: Real-time bidding updates
- **Hedera SDK**: Requires persistent connections
- **Better control**: Custom middleware, rate limiting
- **Database connections**: Connection pooling for performance

Edge functions are great for simple API routes, but marketplace logic needs more compute.

### 3. Why Escrow Smart Contracts for Physical Orders?

**Benefits:**
- **Trustless**: No need to trust platform with funds
- **Transparent**: Buyers can verify escrow on-chain
- **Automated**: Contract enforces rules (refunds, penalties)
- **Secure**: Funds locked until delivery confirmed
- **Cheaper**: Less gas than complex marketplace contracts

**Alternative (not chosen)**: Platform holds funds in hot wallet
- Risk: Platform custody of user funds
- Trust: Users must trust platform won't disappear
- Regulation: May require money transmitter license

### 4. File Size Limits Rationale

**Images (50MB):**
- High-quality art scans (300 DPI, large canvas)
- Uncompressed formats supported
- IPFS pinning costs scale with size

**Videos (200MB):**
- 1-2 minute art process videos
- 1080p resolution supported
- Balance between quality and IPFS costs
- Larger files → longer upload times

**Compression recommendations:**
- Images: WebP/JPEG with 85% quality
- Videos: H.264/H.265 codec, 5-10 Mbps bitrate

### 5. Why 2% Platform Commission?

**Market research:**
- OpenSea: 2.5% (standard)
- Foundation: 15% (curated)
- SuperRare: 15% (primary), 3% (secondary)
- Rarible: 2.5%

**2% is competitive** while covering operational costs:
- Hedera transaction fees
- IPFS storage costs
- Server hosting
- Development/maintenance
- Marketing

**Revenue model:** On $100,000 monthly volume = $2,000 platform revenue

### 6. HBAR/USD Conversion API Options

**Recommended: CoinGecko API**
- Free tier: 50 calls/minute
- Endpoint: `https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd`
- Reliable, widely used
- No authentication required

**Alternatives:**
- CoinMarketCap API (requires key)
- Hedera Mirror Node (no price data)
- Binance API (real-time trading price)

**Implementation:**
- Cache price for 5 minutes (reduce API calls)
- Fallback to last known price if API fails
- Store historical snapshots in database

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Hedera network downtime | Mirror node fallback, transaction queuing |
| IPFS gateway failure | Multi-gateway strategy (Pinata + NFT.Storage) |
| Smart contract bugs | Thorough testing, audit, bug bounty |
| Database failure | Automated backups, read replicas |
| API rate limits | Caching, rate limiting, queue system |

### Business Risks
| Risk | Mitigation |
|------|------------|
| Low artist adoption | Marketing, artist incentives, zero-fee period |
| Fraudulent artists | KYC verification, portfolio review |
| Copyright infringement | Watermark detection, DMCA process |
| Buyer disputes | Clear terms, escrow system, admin override |
| Regulatory compliance | Legal review, terms of service, KYC/AML |

### Operational Risks
| Risk | Mitigation |
|------|------------|
| Team capacity | Phased approach, prioritize MVP |
| Budget overrun | Cost monitoring, free-tier services initially |
| Timeline delays | Buffer time, parallel workstreams |
| Knowledge gaps | Documentation, tutorials, community support |

---

## Success Metrics (KPIs)

### Launch (Month 1-3)
- 50+ verified artists
- 500+ NFTs minted
- 100+ sales completed
- 10+ auctions run
- $10,000+ in sales volume

### Growth (Month 4-6)
- 200+ artists
- 2,000+ NFTs
- 500+ active buyers
- $50,000+ monthly volume
- 20% month-over-month growth

### Maturity (Month 7-12)
- 500+ artists
- 10,000+ NFTs
- 2,000+ active buyers
- $200,000+ monthly volume
- Profitability (revenue > costs)

---

## Cost Estimates

### Development Costs (Self-funded)
- Developer time: 20 weeks × 40 hours = 800 hours
- Freelance rate estimate: $50-100/hr = $40,000-80,000
- (Assumes solo developer or small team)

### Infrastructure Costs (Monthly)
- Vercel (Frontend): $0 (Hobby) → $20 (Pro)
- Railway/Render (Backend): $5-20
- Supabase (Database): $0 (Free) → $25 (Pro)
- IPFS (Pinata): $0-20 (based on storage)
- Domain: $1/month
- Monitoring tools: $0-30
- **Total**: $6-116/month

### Blockchain Costs (Testnet → Mainnet)
- Hedera Testnet: FREE (test HBAR from faucet)
- Mainnet:
  - Account creation: $0.05
  - NFT collection creation: $1
  - NFT mint: $0.001 each
  - HBAR transfers: $0.0001 each
  - Smart contract deploy: $5-10
  - Monthly transaction costs: $50-200 (depending on volume)

---

## Recommended Development Workflow

### Git Workflow
```bash
main (production)
  └── develop (staging)
       ├── feature/nft-minting
       ├── feature/auction-system
       └── feature/escrow-contract
```

### Code Review Process
1. Feature branch → PR to develop
2. Required reviews: 1+ approver
3. Automated tests must pass
4. Deploy to staging environment
5. QA testing
6. Merge to develop
7. Weekly release: develop → main

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
- Run tests (Jest, Playwright)
- Lint code (ESLint, Prettier)
- Build frontend (Next.js)
- Deploy to Vercel (auto-deploy on merge)
- Deploy backend (Railway/Render)
- Run smoke tests
- Notify team (Slack/Discord)
```

---

## Next Steps to Start Implementation

1. **Week 1 Actions:**
   - [ ] Set up GitHub repository with proper structure
   - [ ] Initialize backend Node.js project
   - [ ] Create Supabase project and database
   - [ ] Set up Hedera Testnet account
   - [ ] Register IPFS service account
   - [ ] Create development environment (.env template)

2. **Developer Onboarding:**
   - [ ] Read Hedera documentation (https://docs.hedera.com)
   - [ ] Review HIP-412 standard
   - [ ] Set up local development environment
   - [ ] Run sample Hedera transactions
   - [ ] Test IPFS upload/download

3. **Design Reviews:**
   - [ ] Review database schema (feedback?)
   - [ ] Review API endpoint design
   - [ ] Review smart contract requirements
   - [ ] Review UI/UX flow (Figma?)

---

## Questions for Final Clarification

1. **Team composition:** Solo developer or team? Any existing developers?
2. **Timeline urgency:** Is 20-week timeline acceptable, or need faster MVP?
3. **Budget:** Comfortable with infrastructure costs (~$100-200/month)?
4. **Marketing:** Parallel marketing efforts during development?
5. **Legal:** Terms of service, privacy policy creation (need lawyer)?
6. **Payment:** Treasury account funding (how much HBAR to start)?

---

## Conclusion

This plan provides a comprehensive roadmap to take AfriArt from current UI prototype to fully functional Web3 marketplace. The phased approach allows for:

- **Iterative progress**: Each phase delivers tangible value
- **Risk management**: Test core functionality before full launch
- **Flexibility**: Can adjust priorities based on feedback
- **Quality**: Dedicated testing and QA phase
- **Scalability**: Foundation built for future enhancements

The HIP-412 standard ensures compatibility with major NFT platforms, while Hedera's efficiency keeps costs low for African artists entering Web3.

**Ready to proceed?** Let's start with Phase 1! 🚀
