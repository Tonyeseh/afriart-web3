# Swagger API Documentation Setup - Complete ✅

## Summary

Successfully integrated Swagger/OpenAPI 3.0 documentation into the AfriArt backend API. The interactive documentation is now available at http://localhost:4000/api-docs when the server is running.

---

## What Was Added

### 1. Dependencies Installed

```json
{
  "dependencies": {
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.8"
  }
}
```

### 2. Files Created/Modified

#### Created Files:
- **`src/config/swagger.ts`** - Swagger configuration with schemas and security definitions
- **`SWAGGER_DOCUMENTATION.md`** - Comprehensive guide for using the API documentation
- **`SWAGGER_SETUP_COMPLETE.md`** - This file

#### Modified Files:
- **`src/index.ts`** - Integrated Swagger UI middleware
- **`src/routes/auth.routes.ts`** - Added JSDoc documentation for all auth endpoints
- **`src/routes/user.routes.ts`** - Added JSDoc documentation for all user endpoints

---

## Features

### Interactive API Explorer

✅ **Live Testing** - Execute API requests directly from the browser
✅ **Authentication Support** - Built-in JWT Bearer token authentication
✅ **Request/Response Examples** - See example payloads for all endpoints
✅ **Schema Validation** - View detailed request/response schemas
✅ **HTTP Status Codes** - Understand all possible response codes

### Documented Endpoints

#### Authentication (4 endpoints)
- `GET /api/auth/message` - Get authentication message to sign
- `POST /api/auth/verify` - Verify wallet signature and authenticate
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current authenticated user

#### Users (6 endpoints)
- `POST /api/users/register` - Register a new user
- `GET /api/users` - Get all users (filtered by role)
- `GET /api/users/{walletAddress}` - Get user profile
- `PATCH /api/users/{walletAddress}` - Update user profile
- `DELETE /api/users/{walletAddress}` - Delete user account
- `GET /api/users/{walletAddress}/stats` - Get user statistics

---

## Accessing the Documentation

### Development

1. **Start the backend server:**
   ```bash
   cd backend
   pnpm dev
   ```

2. **Open Swagger UI:**
   - URL: http://localhost:4000/api-docs
   - Alternative JSON: http://localhost:4000/api-docs.json

3. **Health check:**
   - URL: http://localhost:4000/health

### Key Features

#### Security Scheme
The documentation includes JWT Bearer authentication:
- Click the **Authorize** button (top right)
- Enter: `Bearer <your-jwt-token>`
- All protected endpoints will now include your token

#### Organized Tags
- **Authentication** - Wallet-based auth endpoints
- **Users** - User management and profiles
- **Artists** - (Coming soon)
- **NFTs** - (Coming soon)
- **Upload** - (Coming soon)
- **Admin** - (Coming soon)

---

## Quick Start Guide

### 1. Testing Authentication Flow

1. **Get Auth Message:**
   - Navigate to **Authentication** → **GET /api/auth/message**
   - Click "Try it out"
   - Enter wallet address: `0.0.12345`
   - Click "Execute"

2. **Register User:**
   - Navigate to **Users** → **POST /api/users/register**
   - Click "Try it out"
   - Fill in the request body:
   ```json
   {
     "walletAddress": "0.0.12345",
     "role": "artist",
     "displayName": "Test User",
     "email": "test@example.com"
   }
   ```
   - Click "Execute"
   - Copy the JWT token from the response

3. **Authenticate:**
   - Click **Authorize** button (top right)
   - Paste: `Bearer <token-from-step-2>`
   - Click "Authorize"

4. **Test Protected Endpoint:**
   - Navigate to **Authentication** → **GET /api/auth/me**
   - Click "Try it out"
   - Click "Execute"
   - You should see your user profile

---

## Swagger Configuration Details

### API Information

```typescript
{
  title: 'AfriArt NFT Marketplace API',
  version: '1.0.0',
  description: 'AfriArt is a Web3 NFT marketplace connecting African artists with the global market.'
}
```

### Servers

```typescript
[
  {
    url: 'http://localhost:4000',
    description: 'Development server'
  },
  {
    url: 'https://api.afriart.io',
    description: 'Production server'
  }
]
```

### Reusable Schemas

- **User** - Complete user object with all fields
- **UserStats** - User statistics (NFTs, sales, earnings)
- **AuthMessage** - Authentication message format
- **AuthToken** - JWT token response
- **Error** - Standard error response

### Common Responses

- **UnauthorizedError** (401) - Authentication token missing/invalid
- **ForbiddenError** (403) - Insufficient permissions
- **NotFoundError** (404) - Resource not found
- **ValidationError** (400) - Request validation failed

---

## Example Documentation Format

Here's how endpoints are documented in the code:

```typescript
/**
 * @swagger
 * /api/users/{walletAddress}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve a user's profile by wallet address, including statistics
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0\.0\.\d+$'
 *           example: '0.0.12345'
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/:walletAddress', getUserProfile);
```

---

## Testing Tools

### cURL Examples

```bash
# Get authentication message
curl "http://localhost:4000/api/auth/message?walletAddress=0.0.12345"

# Register user
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0.0.12345","role":"artist","displayName":"John Doe"}'

# Get current user (with authentication)
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Postman Integration

1. **Import from OpenAPI:**
   - Open Postman
   - Click "Import"
   - Enter URL: `http://localhost:4000/api-docs.json`

2. **All endpoints automatically imported with:**
   - Request/response examples
   - Authentication configuration
   - Schema validation

---

## Next Steps

### Add Documentation for Remaining Routes

1. **Artist Routes** (`src/routes/artist.routes.ts`)
   - Artist verification
   - Portfolio management
   - KYC submission

2. **NFT Routes** (`src/routes/nft.routes.ts`)
   - NFT minting
   - NFT listing/unlisting
   - NFT transfer
   - Marketplace operations

3. **Upload Routes** (`src/routes/upload.routes.ts`)
   - File upload to IPFS
   - Image/video processing
   - Metadata upload

4. **Admin Routes** (`src/routes/admin.routes.ts`)
   - User management
   - Artist verification approval
   - Platform statistics

### Enhance Existing Documentation

- Add more response examples
- Document all error scenarios
- Add request validation rules
- Include pagination parameters

---

## Code Locations

### Swagger Configuration
- **Config:** [src/config/swagger.ts](src/config/swagger.ts)
- **Integration:** [src/index.ts](src/index.ts#L56-L65)

### Documented Routes
- **Auth:** [src/routes/auth.routes.ts](src/routes/auth.routes.ts)
- **Users:** [src/routes/user.routes.ts](src/routes/user.routes.ts)

### Documentation Guide
- **Full Guide:** [SWAGGER_DOCUMENTATION.md](SWAGGER_DOCUMENTATION.md)

---

## Customization

### Change Swagger UI Theme

Edit `src/index.ts`:

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AfriArt API Documentation',
  customfavIcon: '/path/to/favicon.ico',
  // Add custom CSS for dark theme
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
  `
}));
```

### Add More Servers

Edit `src/config/swagger.ts`:

```typescript
servers: [
  { url: 'http://localhost:4000', description: 'Development' },
  { url: 'https://staging-api.afriart.io', description: 'Staging' },
  { url: 'https://api.afriart.io', description: 'Production' }
]
```

### Restrict Access in Production

```typescript
// Only enable Swagger in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

---

## Benefits

### For Developers

✅ **Faster Development** - See all endpoints in one place
✅ **Easy Testing** - Test APIs without writing code
✅ **Clear Contracts** - Understand request/response formats
✅ **Auto-completion** - Import into Postman/Insomnia

### For Team Collaboration

✅ **Single Source of Truth** - Documentation lives with code
✅ **Always Up-to-Date** - Generated from code comments
✅ **Consistent Format** - OpenAPI standard
✅ **Easy Onboarding** - New developers can explore APIs

### For API Consumers

✅ **Interactive Playground** - Try APIs before integrating
✅ **Code Generation** - Generate client SDKs
✅ **Complete Reference** - All endpoints documented
✅ **Authentication Guide** - Clear auth flow examples

---

## Troubleshooting

### Swagger UI Not Loading

**Problem:** Page shows "Failed to load API definition"

**Solution:**
```bash
# 1. Check if server is running
curl http://localhost:4000/health

# 2. Verify Swagger spec is valid
curl http://localhost:4000/api-docs.json

# 3. Check for TypeScript errors
cd backend
pnpm build

# 4. Restart server
pnpm dev
```

### Documentation Not Updating

**Problem:** Changes to JSDoc comments not reflected

**Solution:**
```bash
# 1. Rebuild the application
pnpm build

# 2. Restart dev server
pnpm dev

# 3. Hard refresh browser
# Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### CORS Issues

**Problem:** Can't access from frontend

**Solution:**
Edit `src/index.ts`:
```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

---

## Resources

- **Swagger Editor:** https://editor.swagger.io
- **OpenAPI Spec:** https://swagger.io/specification/
- **swagger-jsdoc:** https://github.com/Surnet/swagger-jsdoc
- **swagger-ui-express:** https://github.com/scottie1984/swagger-ui-express

---

## Status

✅ **Swagger Configuration** - Complete
✅ **Authentication Endpoints** - Documented (4/4)
✅ **User Endpoints** - Documented (6/6)
⏳ **Artist Endpoints** - Pending
⏳ **NFT Endpoints** - Pending
⏳ **Upload Endpoints** - Pending
⏳ **Admin Endpoints** - Pending

**Overall Progress:** 10/26 endpoints documented (38%)

---

**Last Updated:** 2025-10-25
**Version:** 1.0.0
**Maintainer:** Development Team
