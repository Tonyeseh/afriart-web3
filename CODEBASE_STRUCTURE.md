# AfriArt Codebase Structure

## Current State (As of January 2025)

This document provides a snapshot of the existing codebase structure and what has been implemented.

---

## Directory Tree

```
afriart-web3/
├── app/                                    # Next.js 14 App Router
│   ├── about/                              # About page
│   │   └── page.tsx
│   ├── artist/                             # Artist directory page
│   │   └── page.tsx
│   ├── components/                         # React components
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx       # Image component with error handling
│   │   ├── ui/                             # Shadcn UI components (40+ components)
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ... (30+ more UI components)
│   │   ├── AppLayout.tsx                   # Main app layout wrapper
│   │   ├── ArtistDirectory.tsx             # Artist listing component
│   │   ├── CreateNFTModal.tsx              # NFT creation modal (mock)
│   │   ├── Footer.tsx                      # Site footer
│   │   ├── Gallery.tsx                     # NFT gallery/marketplace
│   │   ├── Homepage.tsx                    # Homepage hero and sections
│   │   ├── Navbar.tsx                      # Navigation bar
│   │   ├── NFTCard.tsx                     # Individual NFT card
│   │   ├── PurchaseModal.tsx               # Purchase/bid modal (mock)
│   │   ├── Toast.tsx                       # Toast notification system
│   │   └── UserDashboard.tsx               # User portfolio dashboard
│   ├── data/
│   │   └── mockNFTs.ts                     # Mock NFT data for development
│   ├── gallery/                            # Gallery page route
│   │   └── page.tsx
│   ├── hooks/
│   │   └── useAppState.ts                  # Global app state hook
│   ├── portfolio/                          # Portfolio page route
│   │   └── page.tsx
│   ├── styles/
│   │   └── globals.css                     # Global styles and Tailwind config
│   ├── utils/
│   │   ├── api.ts                          # Supabase API client (configured but mock)
│   │   ├── formatNumber.ts                 # Number formatting utility
│   │   ├── seedData.ts                     # Database seeding placeholder
│   │   └── supabase/
│   │       └── info.tsx                    # Supabase credentials (auto-generated)
│   ├── globals.css                         # Additional global styles
│   ├── layout.tsx                          # Root layout
│   └── page.tsx                            # Homepage route
│
├── contexts/
│   └── WalletProvider.tsx                  # Hedera wallet integration context
│
├── public/                                 # Static assets (images, icons, etc.)
│
├── .gitignore                              # Git ignore configuration
├── next.config.mjs                         # Next.js configuration
├── next-env.d.ts                           # Next.js TypeScript declarations
├── package.json                            # Frontend dependencies
├── pnpm-lock.yaml                          # pnpm lockfile
├── tsconfig.json                           # TypeScript configuration
├── PROJECT_PLAN.md                         # Implementation roadmap (NEW)
├── README.md                               # Project documentation (UPDATED)
└── CODEBASE_STRUCTURE.md                   # This file (NEW)
```

---

## What's Implemented (UI/Frontend)

### Pages (Routes)
- ✅ **Homepage** (`/`) - Hero section, featured NFTs, collections
- ✅ **Gallery** (`/gallery`) - Browse NFTs with filters
- ✅ **Artist Directory** (`/artist`) - Browse verified artists
- ✅ **Portfolio** (`/portfolio`) - User dashboard for buyers/artists
- ✅ **About** (`/about`) - About AfriArt page

### Components

#### Layout Components
- ✅ **Navbar** - Navigation with wallet connection button (mock)
- ✅ **Footer** - Multi-column footer with links and social media
- ✅ **AppLayout** - Wrapper that manages modals and global state

#### Feature Components
- ✅ **Gallery** - Advanced filtering by:
  - Art technique (7 types)
  - Art material (technique-specific)
  - Listing type (sale/auction)
  - Physical copy availability
  - Search by title/creator
- ✅ **NFTCard** - Display NFT with:
  - Image/artwork
  - Title, creator, price
  - Favorite/watchlist buttons
  - Buy/Bid/Offer actions
  - Auction countdown timer
- ✅ **CreateNFTModal** - 3-step NFT minting flow:
  - Form input (title, description, technique, material, price, file upload)
  - Minting simulation
  - Success confirmation
- ✅ **PurchaseModal** - Purchase flow with:
  - Buy/Bid/Offer modes
  - Physical copy option
  - Contact details form
  - Price calculation
- ✅ **UserDashboard** - Tabbed interface:
  - Profile editing
  - My NFTs (owned)
  - My Creations (minted)
  - Watchlist
  - Favorites
  - Physical Orders tracking
  - Bids & Offers
- ✅ **ArtistDirectory** - Artist cards with:
  - Verification badges
  - NFT count and sales stats
  - Social links
  - Search and filtering

#### Utilities
- ✅ **Toast Notifications** - Context-based notification system
- ✅ **useAppState Hook** - Centralized state management for:
  - Wallet connection status
  - Modal visibility
  - Selected NFT
  - User created NFTs
  - Watchlist and favorites
- ✅ **Shadcn UI Library** - 40+ pre-built components

---

## What's NOT Implemented (Needs Development)

### Backend
- ❌ **Backend Server** - No Node.js/Express server yet
- ❌ **Database** - Supabase configured but schema not created
- ❌ **API Routes** - API client exists but endpoints return mock data
- ❌ **Authentication** - Wallet signature verification not implemented
- ❌ **File Storage** - IPFS integration not implemented

### Blockchain Integration
- ❌ **Hedera SDK** - Wallet connection is UI-only (mock)
- ❌ **NFT Minting** - CreateNFTModal simulates minting, no actual HTS calls
- ❌ **Smart Contracts** - Escrow contracts not written or deployed
- ❌ **Token Transfers** - No actual HBAR or NFT transfers
- ❌ **Transaction Signing** - Mock transaction flow only

### Features
- ❌ **Real Auctions** - Auction UI exists but no real-time bidding
- ❌ **Physical Orders** - Escrow system not implemented
- ❌ **Artist Verification** - KYC upload UI not built
- ❌ **Admin Panel** - No moderation tools
- ❌ **WebSocket** - No real-time updates
- ❌ **Email Notifications** - Not configured

---

## Technology Stack (Current)

### Installed Dependencies

```json
{
  "dependencies": {
    "@hashgraph/hedera-wallet-connect": "^1.5.1",
    "@hashgraph/sdk": "^2.73.2",
    "@radix-ui/*": "Latest (40+ UI components)",
    "@supabase/supabase-js": "^2.57.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "framer-motion": "^11.11.17",
    "lucide-react": "^0.469.0",
    "next": "^14.2.13",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.0",
    "recharts": "^2.15.0",
    "sonner": "^1.7.3",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.13",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

### Configuration Files

**next.config.mjs**
```javascript
{
  reactStrictMode: true,
  images: {
    remotePatterns: [{ hostname: 'images.unsplash.com' }]
  },
  typescript: {
    ignoreBuildErrors: true  // Should be false in production
  },
  eslint: {
    ignoreDuringBuilds: true  // Should be false in production
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": false,  // Should be true for production
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]  // NOTE: Should be app/* for Next.js App Router
    }
  }
}
```

---

## Mock Data Structure

### NFT Object (mockNFTs.ts)
```typescript
interface NFT {
  id: string;
  tokenId: string;
  title: string;
  creator: string;
  creatorAddress: string;
  description: string;
  imageUrl: string;
  priceHbar: number;
  priceUsd: number;
  technique: string;
  material: string;
  listingType: 'sale' | 'auction' | 'not_listed';
  hasPhysicalCopy: boolean;
  physicalCopyPrice?: number;
  shippingCost?: number;
  favorites: number;
  isWatched: boolean;
  isFavorited: boolean;

  // Auction-specific
  currentBid?: number;
  auctionEndTime?: string;
  bidCount?: number;
}
```

### Artist Object
```typescript
interface Artist {
  id: string;
  walletAddress: string;
  displayName: string;
  bio: string;
  profilePicture: string;
  isVerified: boolean;
  nftCount: number;
  totalSales: number;
  primaryTechnique: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}
```

---

## State Management (useAppState)

```typescript
interface AppState {
  // Navigation
  currentPage: string;

  // Wallet
  isWalletConnected: boolean;
  walletAddress: string;

  // Modals
  showPurchaseModal: boolean;
  showCreateNFTModal: boolean;
  selectedNFT: NFT | null;
  purchaseMode: 'buy' | 'bid' | 'offer';

  // User data
  userCreatedNFTs: NFT[];
  watchedNFTs: string[];  // NFT IDs
  favoritedNFTs: string[];  // NFT IDs
}
```

---

## Styling System

### Color Palette
```css
:root {
  --primary: #8b5cf6 (Purple)
  --secondary: #1f1f1f (Dark Gray)
  --accent: #2d1b69 (Dark Purple)
  --destructive: #ef4444 (Red)
  --background: #0a0a0a (Black)
  --border: #2d2d2d (Gray)
}
```

### Typography
- **Font Family**: System font stack
- **Base Size**: 16px
- **Headings**: Bold, gradient effects on hero text
- **Body**: Normal weight, 1.5 line height

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## Immediate Next Steps (From PROJECT_PLAN.md)

To make this application functional, follow the [PROJECT_PLAN.md](PROJECT_PLAN.md) starting with:

### Phase 1: Foundation (Week 1-2)
1. Initialize backend server (Express/Fastify)
2. Create Supabase database schema
3. Set up Hedera Testnet integration
4. Configure IPFS service (Pinata/NFT.Storage)

### Phase 2: Core NFT (Week 3-4)
1. Implement HIP-412 NFT minting
2. Create minting service
3. Build NFT listing/browsing API
4. Implement direct sales

### Phase 3: Auctions (Week 5-6)
1. Auction creation and bidding
2. Real-time WebSocket updates
3. Auction settlement

---

## Key Files to Review

### Critical Frontend Files
1. [app/components/CreateNFTModal.tsx](app/components/CreateNFTModal.tsx) - NFT minting UI
2. [app/components/PurchaseModal.tsx](app/components/PurchaseModal.tsx) - Purchase flow UI
3. [app/components/Gallery.tsx](app/components/Gallery.tsx) - Marketplace UI
4. [contexts/WalletProvider.tsx](contexts/WalletProvider.tsx) - Hedera wallet setup
5. [app/hooks/useAppState.ts](app/hooks/useAppState.ts) - State management

### Configuration Files
1. [next.config.mjs](next.config.mjs) - Next.js settings
2. [tsconfig.json](tsconfig.json) - TypeScript settings
3. [package.json](package.json) - Dependencies
4. [app/utils/api.ts](app/utils/api.ts) - API client structure

---

## Development Workflow

### Current Development Command
```bash
pnpm dev  # Runs Next.js dev server on port 3000
```

### Future Development (After Backend Setup)
```bash
# Terminal 1: Backend
cd backend && pnpm dev  # Port 4000

# Terminal 2: Frontend
pnpm dev  # Port 3000
```

---

## Notes

### Strengths of Current Codebase
- ✅ Clean component architecture
- ✅ Comprehensive UI component library
- ✅ Well-structured pages and routing
- ✅ Good TypeScript setup (though not strict)
- ✅ Tailwind CSS with design system
- ✅ Mock data for rapid prototyping

### Areas for Improvement
- ⚠️ No backend server
- ⚠️ Mock wallet integration (not functional)
- ⚠️ TypeScript strict mode disabled
- ⚠️ Build errors/warnings ignored
- ⚠️ No tests
- ⚠️ Path alias misconfiguration (`src/*` should be `app/*`)

### Security Concerns (Before Production)
- 🔒 Supabase anon key visible in source
- 🔒 No environment variable validation
- 🔒 No input sanitization
- 🔒 No rate limiting
- 🔒 No CSRF protection

---

For complete implementation details, technical decisions, and development timeline, see [PROJECT_PLAN.md](PROJECT_PLAN.md).
