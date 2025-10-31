# AfriArt - Web3 NFT Marketplace for African Artists

**Bridging the gap between African artists and the global marketplace through Web3 technology.**

AfriArt is a decentralized NFT marketplace built on the Hedera network, enabling African artists to mint, sell, and auction their artwork as NFTs with optional physical copy fulfillment.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running the Application](#running-the-application)
- [Architecture](#architecture)
- [User Workflows](#user-workflows)
- [NFT Standards](#nft-standards)
- [Smart Contracts](#smart-contracts)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Documentation](#project-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### For Artists
- **NFT Minting**: Create NFTs from digital art, paintings, photographs, and videos
- **Direct Sales**: List artwork for immediate purchase at fixed prices
- **Timed Auctions**: Configure custom auction durations with real-time bidding
- **Physical Fulfillment**: Offer physical copies of artwork with integrated escrow
- **Portfolio Showcase**: Display verified artist profile with sales history
- **KYC Verification**: Get verified through secure identity and portfolio submission
- **Earnings Dashboard**: Track sales, commissions, and auction performance

### For Buyers
- **Wallet Integration**: Connect with HashPack or Blade Wallet
- **Advanced Filtering**: Search by technique, material, price, listing type
- **Live Auctions**: Participate in real-time bidding with automatic updates
- **Physical Art**: Order physical copies with secure escrow protection
- **Watchlist & Favorites**: Track interesting artworks and artists
- **Purchase History**: View owned NFTs and transaction history

### Platform Features
- **HIP-412 Compliant**: Standard NFT metadata for cross-platform compatibility
- **IPFS Storage**: Decentralized, permanent artwork storage
- **Hedera Network**: Fast (3-5s finality), cheap ($0.001 per mint), carbon-negative
- **Smart Escrow**: Trustless physical order fulfillment via smart contracts
- **Real-time Updates**: WebSocket-powered live auction and notification system
- **Admin Moderation**: Content moderation and artist verification tools
- **2% Platform Fee**: Competitive commission structure

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI components)
- **State Management**: React Context + Custom Hooks
- **Web3 Integration**: Reown AppKit + Wagmi
  - Wallet connectivity via Reown AppKit
  - Hedera network support (Mainnet + Testnet)
  - Multi-wallet support (HashPack, Blade, MetaMask Snaps)
  - Message signing for authentication
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT + Wallet Signature Verification
- **Blockchain**: @hashgraph/sdk (Hedera SDK)
- **File Storage**: IPFS via Pinata/NFT.Storage
- **Real-time**: Socket.io Server
- **Validation**: Zod
- **Logging**: Winston/Pino

### Database
- **Primary**: Supabase (PostgreSQL)
- **Caching**: Redis (future)
- **Search**: PostgreSQL Full-Text Search

### Blockchain
- **Network**: Hedera Hashgraph (Testnet/Mainnet)
- **NFT Standard**: HIP-412
- **Token Service**: Hedera Token Service (HTS)
- **Smart Contracts**: Solidity (Escrow contracts)
- **Indexing**: Hedera Mirror Node API

### DevOps
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway/Render
- **Database**: Supabase Cloud
- **IPFS**: Pinata/NFT.Storage
- **Monitoring**: Sentry, New Relic
- **CI/CD**: GitHub Actions

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (or npm/yarn)
- **Git**: Latest version
- **Hedera Account**: Testnet account with test HBAR ([get from portal](https://portal.hedera.com))
- **Supabase Account**: Free tier account
- **IPFS Service**: Pinata or NFT.Storage account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/afriart-web3.git
   cd afriart-web3
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up backend server**
   ```bash
   cd backend
   pnpm install
   cd ..
   ```

### Environment Setup

#### Frontend Environment Variables

Create `.env.local` in the root directory:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Hedera Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_MIRROR_NODE=https://testnet.mirrornode.hedera.com

# Reown AppKit (WalletConnect v2)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Supabase (Client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Backend Environment Variables

Create `backend/.env`:

```bash
# Server Configuration
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/afriart
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_TREASURY_ID=0.0.xxxxx
HEDERA_TREASURY_KEY=302e020100300506032b657004220420...

# IPFS Configuration
IPFS_PROVIDER=pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION=7d

# External APIs
COINGECKO_API_URL=https://api.coingecko.com/api/v3
PRICE_CACHE_DURATION=300

# Smart Contracts
ESCROW_CONTRACT_ID=0.0.xxxxx
```

### Running the Application

#### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   pnpm dev
   # Server runs on http://localhost:4000
   ```

2. **Start the frontend (in new terminal)**
   ```bash
   pnpm dev
   # App runs on http://localhost:3000
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

#### Production Build

```bash
# Frontend
pnpm build
pnpm start

# Backend
cd backend
pnpm build
pnpm start
```

---

## Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                         │
│  Next.js 14 App • React Components • Wallet Connect    │
└───────────────────────┬────────────────────────────────┘
                        │ HTTPS/WSS
┌───────────────────────┴────────────────────────────────┐
│                 APPLICATION LAYER                      │
│  Express API • Business Logic • WebSocket Server       │
└───────────────────────┬────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│   Supabase   │ │    IPFS     │ │   Hedera   │
│  PostgreSQL  │ │  (Pinata)   │ │  Network   │
└──────────────┘ └─────────────┘ └────────────┘
```

---

## Wallet Integration

### Reown AppKit (formerly WalletConnect)

AfriArt uses **Reown's AppKit** for secure and user-friendly wallet connectivity on Hedera network.

#### Features
- **Multi-Wallet Support**: Connect with HashPack, Blade, MetaMask Snaps, and other Hedera-compatible wallets
- **Seamless UX**: Beautiful modal with automatic wallet detection
- **Message Signing**: Secure authentication via wallet signatures
- **Session Management**: Persistent connections with automatic reconnection
- **Network Switching**: Easy toggle between Mainnet and Testnet

#### Getting Your Project ID

1. Visit [Reown Cloud Dashboard](https://cloud.reown.com)
2. Create a new project
3. Copy your Project ID
4. Add it to `.env.local` as `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`

#### Usage in Components

```typescript
import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const { connect, disconnect, isConnected, accountId } = useWallet();

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

#### Authentication Flow

1. User clicks "Connect Wallet"
2. AppKit modal opens with available wallets
3. User selects wallet and approves connection
4. Backend fetches public key from Hedera Mirror Node
5. User signs authentication message
6. Backend verifies signature and issues JWT token
7. User is authenticated and can interact with platform

---

## User Workflows

For detailed user journeys, workflow diagrams, and feature explanations, please refer to the [PROJECT_PLAN.md](PROJECT_PLAN.md) document which includes:

- **Artist Journey**: Onboarding, NFT minting, managing physical orders
- **Buyer Journey**: Discovering art, purchasing NFTs, participating in auctions
- **Physical Copy Orders**: Complete escrow flow with smart contracts
- **Auction Mechanics**: Real-time bidding system

---

## NFT Standards

### HIP-412 (Hedera NFT Metadata Standard)

AfriArt NFTs comply with [HIP-412](https://hips.hedera.com/hip/hip-412), ensuring compatibility with:
- Hedera wallets (HashPack, Blade)
- NFT explorers (Hashscan, Dragon Glass)
- Future marketplaces

**Key Benefits:**
- **Interoperability**: Works across Hedera ecosystem
- **Rich metadata**: Detailed artwork information
- **Multi-language**: Support for multiple locales
- **Extensible**: Custom properties for AfriArt-specific data
- **IPFS-native**: Permanent, decentralized storage

For complete metadata structure and examples, see [PROJECT_PLAN.md](PROJECT_PLAN.md).

---

## Smart Contracts

### Deployed Contracts (Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| NFT Collection Token | `0.0.TBD` | Main AfriArt NFT collection |
| Physical Order Escrow | `0.0.TBD` | Secure physical copy payments |

### Escrow Contract Functions

**For Buyers:**
- `createEscrow(orderId, artist)` - Lock funds for physical order
- `confirmDelivery(orderId)` - Release funds to artist

**For Artists:**
- `acceptOrder(orderId)` - Accept physical copy commission
- `declineOrder(orderId)` - Decline and trigger refund (with penalty)
- `markShipped(orderId)` - Update shipping status

**For Platform:**
- `autoConfirmDelivery(orderId)` - Auto-release after 30 days
- `resolveDispute(orderId, winner)` - Manual intervention

For complete smart contract code and implementation details, see [PROJECT_PLAN.md](PROJECT_PLAN.md).

---

## API Documentation

### Base URL
- **Development**: `http://localhost:4000/api`
- **Production**: `https://api.afriart.xyz/api`

### Core Endpoints

#### NFTs
- `POST /api/nfts/mint` - Mint new NFT
- `GET /api/nfts` - List NFTs with filters
- `GET /api/nfts/:id` - Get NFT details
- `POST /api/nfts/:id/purchase` - Purchase NFT

#### Auctions
- `POST /api/auctions` - Create auction
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions/:id/bid` - Place bid

#### Users
- `POST /api/users/register` - Register user
- `GET /api/users/:walletAddress` - Get user profile
- `PATCH /api/users/:walletAddress` - Update profile

For complete API documentation with request/response examples, see [PROJECT_PLAN.md](PROJECT_PLAN.md).

---

## Testing

### Run Tests

```bash
# Backend tests
cd backend
pnpm test              # Run all tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests
pnpm test:coverage     # Coverage report

# Frontend tests
pnpm test              # Component tests
pnpm test:e2e          # Playwright E2E tests
```

### Testing with Hedera Testnet

1. **Get Test HBAR**: https://portal.hedera.com/register
2. **Use Test Accounts**: Create multiple accounts for testing
3. **Mirror Node**: Verify transactions at https://testnet.mirrornode.hedera.com

---

## Deployment

### Vercel (Frontend)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy: `vercel --prod`

### Railway/Render (Backend)
1. Create new project
2. Connect GitHub repository
3. Set environment variables
4. Configure build: `pnpm install && pnpm build`
5. Configure start: `pnpm start`

### Smart Contracts (Mainnet)
```bash
cd backend/src/contracts
npx hardhat compile
npx hardhat run scripts/deploy-escrow.ts --network hedera-mainnet
```

---

## Project Documentation

- **[PROJECT_PLAN.md](PROJECT_PLAN.md)** - Comprehensive 20-week implementation roadmap with:
  - 10 detailed implementation phases
  - Complete database schema
  - Workflow diagrams (minting, auctions, escrow)
  - Smart contract code examples
  - API endpoint specifications
  - Technical decision explanations
  - Risk mitigation strategies
  - Success metrics and KPIs

- **Figma Design**: [AfriArt NFT Marketplace](https://www.figma.com/design/0jptzT2YZBPRPEIvEmJl1U/AfriArt-NFT-Marketplace-SRS)

---

## Contributing

We welcome contributions! Development workflow:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

**Code Style:**
- TypeScript strict mode
- ESLint + Prettier
- Pre-commit hooks with Husky

---

## License

This project is licensed under the MIT License.

---

## Support

- **Email**: support@afriart.xyz
- **Discord**: https://discord.gg/afriart
- **Twitter**: [@AfriArtNFT](https://twitter.com/AfriArtNFT)

---

## Roadmap

### Q1 2025 - MVP Launch
- ✅ Basic UI and navigation
- ✅ Wallet integration with Reown AppKit
- ✅ Authentication system with JWT + wallet signatures
- ✅ NFT listing and viewing
- 🚧 NFT minting with HIP-412
- 🚧 Direct sales and auctions
- 🚧 Physical copy escrow
- 🚧 Artist verification (KYC)

### Q2 2025 - Feature Expansion
- Secondary market trading
- Royalty enforcement
- Artist collections
- Mobile app

### Q3 2025 - Global Expansion
- Multi-language support
- Fiat payment integration
- Regional shipping

### Q4 2025 - Community Features
- Social features
- DAO governance
- Community grants

---

## Acknowledgments

- **Hedera Hashgraph** - Sustainable Web3 infrastructure
- **African Artists** - For inspiring this platform
- **Shadcn** - Amazing UI component library
- **Open Source Community** - Tools and libraries

---

**Built with ❤️ for African artists and the global art community**

*AfriArt - Where African creativity meets Web3 innovation*
