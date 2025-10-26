# Getting Started with AfriArt Development

Welcome to the AfriArt NFT Marketplace project! This guide will help you understand the project and start contributing.

---

## 📚 What is AfriArt?

AfriArt is a Web3 NFT marketplace that bridges the gap between African artists and the global art market. Artists can mint their artwork as NFTs on the Hedera blockchain, sell them directly, or auction them off. Buyers can discover unique African art and purchase NFTs using HBAR (Hedera's cryptocurrency).

### Key Features

- **For Artists**: Mint NFTs, set prices, manage sales
- **For Buyers**: Browse art, purchase NFTs, collect favorites
- **For Platform**: 2% commission, artist verification (KYC)

---

## 🗂️ Project Structure

```
afriart-web3/
├── frontend/              # Next.js React application
│   ├── app/              # Pages and components
│   ├── contexts/         # React contexts (Wallet, etc.)
│   └── package.json
├── backend/              # Node.js Express API
│   ├── src/              # TypeScript source code
│   ├── database/         # SQL schema
│   └── package.json
├── docs/                 # Documentation (you are here!)
│   ├── PROJECT_PLAN.md           # Full 20-week plan
│   ├── MVP_PLAN.md               # Focused 8-week MVP
│   ├── UI_REVIEW_AND_IMPROVEMENTS.md
│   ├── SETUP_GUIDE.md
│   └── GETTING_STARTED.md (this file)
├── .gitignore
└── README.md             # Main project README
```

---

## 📖 Documentation Overview

### Start Here

1. **[GETTING_STARTED.md](GETTING_STARTED.md)** ⬅️ **You are here!**
   - Quick overview of the project
   - Where to find information
   - How to get started

2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
   - Install dependencies
   - Configure environment variables
   - Run the app locally
   - Troubleshooting

### Development Plans

3. **[MVP_PLAN.md](MVP_PLAN.md)** - **8-Week Focused Plan**
   - Core features only (minting + direct sales)
   - Week-by-week roadmap
   - Simplified scope for solo developer
   - **Start here for implementation!**

4. **[PROJECT_PLAN.md](PROJECT_PLAN.md)** - Complete 20-Week Plan
   - Full feature set (includes auctions, physical copies)
   - Comprehensive architecture
   - Database schema details
   - Smart contract examples
   - Use as reference for future phases

### Technical Guides

5. **[UI_REVIEW_AND_IMPROVEMENTS.md](UI_REVIEW_AND_IMPROVEMENTS.md)**
   - Component-by-component review
   - Improvement suggestions
   - Code examples
   - Priority fixes before backend integration

6. **[CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md)**
   - Current codebase overview
   - What's implemented vs. what's not
   - Mock data structures
   - File locations

7. **[backend/README.md](backend/README.md)**
   - Backend API documentation
   - Available endpoints
   - How to add new routes
   - Deployment instructions

---

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites

- Node.js 18+, pnpm
- Hedera Testnet account
- Supabase account
- Pinata account

### 2. Install & Run

```bash
# Clone repo
git clone <repo-url>
cd afriart-web3

# Backend
cd backend
cp .env.example .env
# Edit .env with your credentials
pnpm install
pnpm dev  # Runs on :4000

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev  # Runs on :3000
```

### 3. Open App

- Frontend: http://localhost:3000
- Backend: http://localhost:4000/health

**Detailed setup?** See [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 🎯 Current Status

### ✅ Completed

- [x] UI/UX design and components
- [x] Frontend routing and pages
- [x] Backend server structure
- [x] Database schema designed
- [x] Documentation (plans, guides)
- [x] Project organization

### 🚧 In Progress

- [ ] Backend API implementation (Week 1-2)
- [ ] Authentication with wallet signatures
- [ ] Database integration

### 📅 Coming Next (MVP - 8 Weeks)

- **Week 2**: User authentication & profiles
- **Week 3**: IPFS file upload
- **Week 4**: NFT minting with HIP-412
- **Week 5**: Marketplace & gallery APIs
- **Week 6**: Direct sales & payments
- **Week 7**: Artist verification & admin panel
- **Week 8**: Testing & deployment

See [MVP_PLAN.md](MVP_PLAN.md) for details.

---

## 🛠️ Development Workflow

### Where to Start?

1. **First Time Setup**
   - Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
   - Set up your environment
   - Run the app locally
   - Verify all connections work

2. **Understanding the Codebase**
   - Read [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md)
   - Explore existing components in `frontend/app/components/`
   - Check backend structure in `backend/src/`

3. **Start Coding**
   - Pick a task from [MVP_PLAN.md](MVP_PLAN.md)
   - Read the UI improvements for that component
   - Create a feature branch
   - Implement, test, commit

### Recommended Order for Solo Developer

**Phase 1: Backend Foundation (Week 1-2)**
- Set up Supabase database
- Implement user authentication
- Create user registration API
- Test with Postman

**Phase 2: File Handling (Week 3)**
- IPFS service integration
- File upload endpoint
- Connect frontend upload to backend

**Phase 3: NFT Minting (Week 4)**
- Create Hedera NFT collection
- Implement minting service
- Connect frontend minting modal

**Phase 4: Marketplace (Week 5-6)**
- NFT listing APIs
- Purchase flow
- Transaction handling

**Phase 5: Polish (Week 7-8)**
- Artist verification
- Admin panel
- Testing & deployment

---

## 📝 Coding Standards

### TypeScript
- **Backend**: Strict mode enabled
- **Frontend**: Enable strict mode (currently disabled)
- Always type function parameters and returns
- Use interfaces for complex objects

### Git Commits

```bash
feat: add user authentication endpoint
fix: resolve NFT minting transaction error
docs: update setup guide with IPFS instructions
refactor: improve error handling in API
test: add unit tests for Hedera service
```

### Code Review Checklist

- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Loading states added (frontend)
- [ ] Validation on inputs
- [ ] Logs for debugging
- [ ] Comments for complex logic
- [ ] No sensitive data in code

---

## 🔧 Tools & Technologies

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Shadcn UI**: Component library
- **Hedera Wallet Connect**: Wallet integration

### Backend
- **Node.js + Express**: API server
- **TypeScript**: Type safety
- **Hedera SDK**: Blockchain integration
- **Supabase**: PostgreSQL database
- **Pinata**: IPFS file storage
- **Pino**: Logging

### Development
- **pnpm**: Package manager
- **nodemon**: Hot reload
- **ts-node**: TypeScript execution

---

## 🤔 Common Questions

### Q: I'm new to Web3/blockchain. Where do I start?

**A:** Start with these resources:
1. [Hedera Basics](https://docs.hedera.com/hedera/getting-started/introduction)
2. [What is an NFT?](https://docs.hedera.com/hedera/core-concepts/tokens/nfts)
3. [HIP-412 Standard](https://hips.hedera.com/hip/hip-412)

Then work on backend first - you don't need to understand blockchain deeply to build the API layer.

### Q: Should I implement MVP features or full project features?

**A:** Stick to **MVP_PLAN.md** for now. It's focused on core functionality:
- NFT minting
- Direct sales only
- No auctions (Phase 2)
- No physical copies (Phase 2)

This gets you to a working product in 8 weeks.

### Q: What if I encounter a bug or get stuck?

**A:** Follow this process:
1. Check error logs (backend terminal, browser console)
2. Read relevant documentation section
3. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) troubleshooting
4. Google the error message
5. Check Hedera/Supabase/Next.js docs
6. Create a GitHub issue with details

### Q: Can I modify the UI components?

**A:** Yes! See [UI_REVIEW_AND_IMPROVEMENTS.md](UI_REVIEW_AND_IMPROVEMENTS.md) for suggested improvements. Priority fixes are marked as "Critical" or "High Priority".

### Q: How do I test Hedera transactions without spending money?

**A:** Use Hedera Testnet:
1. Create account at portal.hedera.com
2. Get free test HBAR from faucet
3. All transactions are free on testnet
4. Switch to Mainnet only when ready for production

---

## 📞 Getting Help

### Documentation
- [Hedera Docs](https://docs.hedera.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn UI](https://ui.shadcn.com)

### Debugging
- Check backend logs in terminal
- Check browser DevTools console
- Check Network tab for API errors
- Check Supabase logs in dashboard
- Use Hedera Mirror Node to verify transactions

### External Communities
- [Hedera Discord](https://hedera.com/discord)
- [Next.js Discord](https://nextjs.org/discord)
- Stack Overflow (tag: hedera, next.js)

---

## 🎉 Ready to Build!

You now have everything you need to start building AfriArt:

1. ✅ **Understand the project** - Read this document
2. 📝 **Set up your environment** - Follow [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. 🗺️ **Pick your starting point** - See [MVP_PLAN.md](MVP_PLAN.md)
4. 💻 **Start coding** - Week 2: Authentication!

### Your First Task

**Implement User Registration Endpoint** (Week 2, Monday-Tuesday)

1. Create `/api/users/register` endpoint
2. Validate wallet signature
3. Save user to database
4. Return JWT token
5. Test with Postman

See `backend/src/routes/user.routes.ts` to get started!

---

**Let's build something amazing! 🚀**

*Questions? Check the docs above or create a GitHub issue.*
