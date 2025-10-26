# AfriArt Backend API

Backend server for the AfriArt NFT Marketplace built with Node.js, Express, and TypeScript.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Hedera Hashgraph (@hashgraph/sdk)
- **File Storage**: IPFS via Pinata
- **Authentication**: JWT + Wallet Signatures
- **Logging**: Pino

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Supabase client
│   │   └── logger.ts    # Pino logger setup
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   │   ├── hedera.service.ts    # Hedera SDK wrapper
│   │   ├── ipfs.service.ts      # IPFS upload/retrieval
│   │   ├── nft.service.ts       # NFT minting logic
│   │   └── auth.service.ts      # Authentication
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── artist.routes.ts
│   │   ├── nft.routes.ts
│   │   ├── upload.routes.ts
│   │   └── admin.routes.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   ├── models/          # Database models/types
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── index.ts         # Server entry point
├── dist/                # Compiled JavaScript (generated)
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Hedera Testnet account ([get from portal](https://portal.hedera.com))
- Supabase project
- Pinata account for IPFS

### Installation

1. **Install dependencies**
   ```bash
   cd backend
   pnpm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Required environment variables**
   - `HEDERA_OPERATOR_ID` - Your Hedera account ID
   - `HEDERA_OPERATOR_KEY` - Your Hedera private key
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_KEY` - Supabase service role key
   - `PINATA_API_KEY` - Pinata API key
   - `PINATA_SECRET_KEY` - Pinata secret key
   - `JWT_SECRET` - Secret for JWT tokens

### Development

```bash
# Start development server with hot reload
pnpm dev

# Build TypeScript
pnpm build

# Start production server
pnpm start
```

The server will run on `http://localhost:4000`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/connect` - Initiate wallet connection
- `POST /api/auth/verify` - Verify wallet signature and get JWT

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
- `POST /api/nfts/:id/purchase` - Purchase NFT

### Upload
- `POST /api/upload/file` - Upload file to IPFS

### Admin
- `GET /api/admin/pending-verifications` - List pending artists
- `PATCH /api/admin/artists/:id/approve` - Approve artist
- `PATCH /api/admin/artists/:id/reject` - Reject artist

## Development Workflow

### Adding a New Feature

1. **Create service** in `src/services/`
2. **Create controller** in `src/controllers/`
3. **Add routes** in `src/routes/`
4. **Register routes** in `src/index.ts`
5. **Test** with Postman/curl

### Example: Adding a New Endpoint

```typescript
// 1. Service (src/services/example.service.ts)
export class ExampleService {
  async getData() {
    // Business logic
    return { data: 'example' };
  }
}

// 2. Controller (src/controllers/example.controller.ts)
import { Request, Response } from 'express';
import { ExampleService } from '../services/example.service';

const service = new ExampleService();

export async function getExample(req: Request, res: Response) {
  try {
    const result = await service.getData();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 3. Routes (src/routes/example.routes.ts)
import { Router } from 'express';
import { getExample } from '../controllers/example.controller';

const router = Router();
router.get('/', getExample);

export default router;

// 4. Register in src/index.ts
import exampleRoutes from './routes/example.routes';
app.use('/api/example', exampleRoutes);
```

## Testing

```bash
# Run tests (when implemented)
pnpm test

# Run linter
pnpm lint
```

## Deployment

### Vercel (not recommended for backend)
### Railway (recommended)

1. Create Railway project
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Render (alternative)

1. Create new Web Service
2. Connect repository
3. Build command: `pnpm install && pnpm build`
4. Start command: `pnpm start`
5. Add environment variables

## Environment Variables Reference

```bash
# Server
NODE_ENV=development|production
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...

# Hedera
HEDERA_NETWORK=testnet|mainnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...
HEDERA_TREASURY_ID=0.0.xxxxx
HEDERA_NFT_COLLECTION_ID=0.0.xxxxx

# IPFS
PINATA_API_KEY=xxx
PINATA_SECRET_KEY=xxx

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# External APIs
COINGECKO_API_URL=https://api.coingecko.com/api/v3
PRICE_CACHE_DURATION=300

# Platform
PLATFORM_FEE_PERCENT=2
```

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

**TypeScript errors**
```bash
# Clear dist folder and rebuild
rm -rf dist && pnpm build
```

**Database connection fails**
- Check Supabase URL and service key
- Verify network connectivity
- Check Supabase project status

**Hedera connection fails**
- Verify operator ID and key
- Check Hedera network status
- Ensure sufficient HBAR balance

## Next Steps

See [MVP_PLAN.md](../MVP_PLAN.md) for the complete 8-week implementation roadmap.

Current implementation status:
- ✅ Project structure set up
- ✅ Basic Express server
- ✅ Error handling middleware
- ✅ Logging configuration
- ⏳ Authentication (Week 2)
- ⏳ IPFS integration (Week 3)
- ⏳ NFT minting (Week 4)
- ⏳ Marketplace APIs (Week 5-6)

## License

MIT
