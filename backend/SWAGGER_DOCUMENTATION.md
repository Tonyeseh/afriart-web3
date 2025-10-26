# Swagger API Documentation Guide

## Overview

The AfriArt backend now includes comprehensive API documentation using Swagger/OpenAPI 3.0. This provides an interactive interface to explore, test, and understand all available API endpoints.

---

## Accessing the Documentation

### Development Environment

Once the server is running, access the Swagger UI at:

**URL:** http://localhost:4000/api-docs

### Alternative Formats

- **Swagger JSON:** http://localhost:4000/api-docs.json
- **Health Check:** http://localhost:4000/health

---

## Features

### Interactive API Explorer

- **Try It Out:** Execute API requests directly from the browser
- **Authentication:** Built-in support for JWT Bearer token authentication
- **Request/Response Examples:** See example payloads for all endpoints
- **Schema Validation:** View detailed request/response schemas
- **HTTP Status Codes:** Understand all possible response codes

### Organized by Tags

The API is organized into logical groups:

1. **Authentication** - Wallet-based auth endpoints
2. **Users** - User management and profiles
3. **Artists** - Artist verification (coming soon)
4. **NFTs** - NFT operations (coming soon)
5. **Upload** - File upload to IPFS (coming soon)
6. **Admin** - Administrative functions (coming soon)

---

## Using the Swagger UI

### 1. Testing Authentication Flow

#### Step 1: Get Authentication Message

1. Navigate to **Authentication** → **GET /api/auth/message**
2. Click "Try it out"
3. Enter a test wallet address (e.g., `0.0.12345`)
4. Click "Execute"
5. Copy the `message` from the response

#### Step 2: Verify Signature (Mock for Testing)

Since we don't have a real wallet in the browser, you'll need to:
- Use a tool like Postman or curl for real wallet signature testing
- Or set up a test environment with mock signatures

#### Step 3: Use JWT Token

1. After receiving a JWT token from `/api/auth/verify`
2. Click the **Authorize** button at the top right
3. Enter: `Bearer <your-jwt-token>`
4. Click "Authorize"
5. Now all protected endpoints will include your token

### 2. Testing User Endpoints

#### Get User Profile

1. Navigate to **Users** → **GET /api/users/{walletAddress}**
2. Click "Try it out"
3. Enter wallet address: `0.0.12345`
4. Click "Execute"

#### Update Profile (Requires Auth)

1. Make sure you're authenticated (see step 3 above)
2. Navigate to **Users** → **PATCH /api/users/{walletAddress}**
3. Click "Try it out"
4. Enter your wallet address
5. Modify the request body:
```json
{
  "displayName": "Updated Name",
  "bio": "New bio text"
}
```
6. Click "Execute"

---

## API Endpoints Documentation

### Authentication Endpoints

#### `GET /api/auth/message`

**Purpose:** Generate a timestamped message for wallet signing

**Parameters:**
- `walletAddress` (query, required): Hedera wallet address (format: `0.0.xxxxx`)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "AfriArt Authentication\n\nWallet: 0.0.12345\nTimestamp: 1730000000000\n\nSign this message...",
    "expiresInMinutes": 5
  }
}
```

---

#### `POST /api/auth/verify`

**Purpose:** Verify wallet signature and authenticate user

**Request Body:**
```json
{
  "walletAddress": "0.0.12345",
  "message": "AfriArt Authentication...",
  "signature": "abc123def456...",
  "publicKey": "302a300506032b6570032100..."
}
```

**Response (Existing User):**
```json
{
  "success": true,
  "needsRegistration": false,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "walletAddress": "0.0.12345",
      "role": "artist",
      "displayName": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Response (New User):**
```json
{
  "success": true,
  "needsRegistration": true,
  "data": {
    "walletAddress": "0.0.12345",
    "publicKey": "302a300506032b6570032100..."
  }
}
```

---

#### `GET /api/auth/me`

**Purpose:** Get current authenticated user's profile

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "walletAddress": "0.0.12345",
      "role": "artist",
      "displayName": "John Doe",
      "email": "john@example.com",
      "bio": "Digital artist from Lagos",
      "createdAt": "2025-10-25T10:00:00.000Z"
    }
  }
}
```

---

#### `POST /api/auth/logout`

**Purpose:** Logout current user

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Endpoints

#### `POST /api/users/register`

**Purpose:** Register a new user after wallet verification

**Request Body:**
```json
{
  "walletAddress": "0.0.12345",
  "role": "artist",
  "displayName": "John Doe",
  "email": "john@example.com",
  "bio": "Digital artist from Lagos",
  "profilePictureUrl": "https://ipfs.io/ipfs/Qm...",
  "socialLinks": {
    "twitter": "https://twitter.com/johndoe",
    "instagram": "https://instagram.com/johndoe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "walletAddress": "0.0.12345",
      "role": "artist",
      "displayName": "John Doe",
      "createdAt": "2025-10-25T10:00:00.000Z"
    }
  }
}
```

---

#### `GET /api/users`

**Purpose:** Get list of users (filtered by role)

**Parameters:**
- `role` (query, required): Filter by role (`artist` currently supported)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "walletAddress": "0.0.12345",
        "role": "artist",
        "displayName": "John Doe",
        "bio": "Digital artist",
        "profilePictureUrl": "https://...",
        "socialLinks": {},
        "createdAt": "2025-10-25T10:00:00.000Z"
      }
    ],
    "count": 25
  }
}
```

---

#### `GET /api/users/{walletAddress}`

**Purpose:** Get user profile by wallet address

**Parameters:**
- `walletAddress` (path, required): Hedera wallet address

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "walletAddress": "0.0.12345",
      "role": "artist",
      "displayName": "John Doe",
      "email": "john@example.com",
      "bio": "Digital artist from Lagos",
      "profilePictureUrl": "https://...",
      "socialLinks": {},
      "createdAt": "2025-10-25T10:00:00.000Z",
      "updatedAt": "2025-10-25T10:00:00.000Z"
    },
    "stats": {
      "nftsOwned": 5,
      "nftsCreated": 12,
      "favoritesCount": 8,
      "salesMade": 10,
      "purchasesMade": 3,
      "totalEarningsHbar": 1250.50
    }
  }
}
```

---

#### `PATCH /api/users/{walletAddress}`

**Purpose:** Update user profile

**Authentication:** Required (Bearer token) + Must be owner or admin

**Request Body:**
```json
{
  "displayName": "Updated Name",
  "email": "newemail@example.com",
  "bio": "Updated bio",
  "profilePictureUrl": "https://...",
  "socialLinks": {
    "twitter": "https://twitter.com/new"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "walletAddress": "0.0.12345",
      "displayName": "Updated Name",
      "updatedAt": "2025-10-25T11:00:00.000Z"
    }
  }
}
```

---

#### `DELETE /api/users/{walletAddress}`

**Purpose:** Delete user account

**Authentication:** Required (Bearer token) + Must be owner or admin

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

#### `GET /api/users/{walletAddress}/stats`

**Purpose:** Get user statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "nftsOwned": 5,
      "nftsCreated": 12,
      "favoritesCount": 8,
      "salesMade": 10,
      "purchasesMade": 3,
      "totalEarningsHbar": 1250.50
    }
  }
}
```

---

## Response Schema Reference

### User Object

```typescript
{
  id: string (uuid)
  walletAddress: string (format: 0.0.xxxxx)
  role: 'buyer' | 'artist' | 'admin'
  displayName: string | null
  email: string | null
  bio: string | null
  profilePictureUrl: string | null
  socialLinks: Record<string, string>
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

### UserStats Object

```typescript
{
  nftsOwned: number
  nftsCreated: number
  favoritesCount: number
  salesMade: number
  purchasesMade: number
  totalEarningsHbar: number
}
```

### Error Response

```typescript
{
  success: false
  error: string
}
```

---

## HTTP Status Codes

### Success Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully

### Client Error Codes

- **400 Bad Request** - Validation error or malformed request
- **401 Unauthorized** - Authentication required or token invalid
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists

### Server Error Codes

- **500 Internal Server Error** - Unexpected server error

---

## Testing with cURL

### Get Authentication Message

```bash
curl -X GET "http://localhost:4000/api/auth/message?walletAddress=0.0.12345"
```

### Register User

```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0.0.12345",
    "role": "artist",
    "displayName": "John Doe",
    "email": "john@example.com"
  }'
```

### Get User Profile (Authenticated)

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Update User Profile

```bash
curl -X PATCH http://localhost:4000/api/users/0.0.12345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "bio": "New bio"
  }'
```

---

## Testing with Postman

### 1. Import from OpenAPI

1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:4000/api-docs.json`
4. Postman will auto-generate all endpoints

### 2. Set Up Environment

Create a Postman environment with:
- `baseUrl`: `http://localhost:4000`
- `token`: Your JWT token (update after login)

### 3. Configure Authorization

1. In each authenticated request, go to "Authorization" tab
2. Select "Bearer Token"
3. Enter: `{{token}}`

---

## Customization

### Swagger Configuration

Edit `backend/src/config/swagger.ts` to customize:

- **API Information** - Title, description, version
- **Servers** - Add production/staging URLs
- **Security Schemes** - Modify authentication methods
- **Schemas** - Add new reusable schemas
- **Tags** - Organize endpoints into categories

### Adding Documentation to New Routes

Add JSDoc comments above route definitions:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [YourTag]
 *     parameters:
 *       - in: query
 *         name: paramName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/your-endpoint', handler);
```

---

## Security Considerations

### API Documentation Access

**Development:**
- Swagger UI is publicly accessible
- Useful for development and testing

**Production:**
- Consider restricting `/api-docs` access
- Options:
  - Disable in production (`NODE_ENV === 'production'`)
  - Add IP whitelist
  - Require authentication

### Example: Disable in Production

```typescript
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

---

## Troubleshooting

### Swagger UI Not Loading

1. **Check server is running:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Verify Swagger spec is valid:**
   ```bash
   curl http://localhost:4000/api-docs.json | jq
   ```

3. **Check console for errors:**
   - Look at server logs
   - Check browser console

### Documentation Not Updating

1. **Rebuild the project:**
   ```bash
   pnpm build
   ```

2. **Restart the server:**
   ```bash
   pnpm dev
   ```

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

### CORS Issues

If testing from a different origin:

```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

---

## Next Steps

1. **Add Documentation for Remaining Endpoints:**
   - Artist verification routes
   - NFT minting routes
   - Upload routes
   - Admin routes

2. **Enhance Schemas:**
   - Add more detailed examples
   - Include validation rules
   - Document all edge cases

3. **Add Authentication Examples:**
   - Include working auth flow examples
   - Add test credentials for sandbox

4. **Create Postman Collection:**
   - Export complete collection
   - Add pre-request scripts
   - Include test assertions

---

## Resources

- **Swagger/OpenAPI Specification:** https://swagger.io/specification/
- **Swagger UI:** https://swagger.io/tools/swagger-ui/
- **JSDoc Tags:** https://github.com/Surnet/swagger-jsdoc#supported-jsdoc-tags
- **OpenAPI Examples:** https://github.com/OAI/OpenAPI-Specification/tree/main/examples

---

**Status:** ✅ Swagger Documentation Complete
**Version:** 1.0.0
**Last Updated:** 2025-10-25
