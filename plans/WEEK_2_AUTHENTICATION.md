# Week 2 MVP: User Management & Authentication

## Overview

**Goal**: Implement wallet-based authentication system that allows users to connect their Hedera wallet, register/login, and access protected routes.

**Duration**: 5 days (Monday-Friday)

**Key Deliverables**:
- Wallet signature verification
- JWT token generation and validation
- User registration and profile management
- Protected API routes
- Frontend wallet integration (real, not mock)

---

## Day 1 (Monday): Wallet Authentication Foundation

### Morning: Hedera Wallet Signature Verification

**Task 1.1: Create Authentication Service**

Create `backend/src/services/auth.service.ts`:

```typescript
import { PublicKey } from '@hashgraph/sdk';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';

interface SignaturePayload {
  walletAddress: string;
  timestamp: number;
  message: string;
}

export class AuthService {
  /**
   * Verify wallet signature
   * How it works:
   * 1. User signs a message with their private key in the wallet
   * 2. We receive: message, signature, and public key
   * 3. We verify the signature matches the message
   */
  async verifyWalletSignature(
    message: string,
    signature: Uint8Array,
    publicKeyString: string
  ): Promise<boolean> {
    try {
      // Convert string to PublicKey object
      const publicKey = PublicKey.fromString(publicKeyString);

      // Verify signature
      const isValid = publicKey.verify(
        Buffer.from(message),
        signature
      );

      logger.info(`Signature verification: ${isValid}`);
      return isValid;
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(userId: string, walletAddress: string, role: string): string {
    const payload = {
      userId,
      walletAddress,
      role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    return token;
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create authentication message for user to sign
   * This prevents replay attacks by including timestamp
   */
  createAuthMessage(walletAddress: string): string {
    const timestamp = Date.now();
    return `AfriArt Authentication\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nSign this message to prove you own this wallet.`;
  }

  /**
   * Validate authentication message (check timestamp isn't too old)
   */
  validateAuthMessage(message: string): boolean {
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (!timestampMatch) return false;

    const timestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Message must be signed within last 5 minutes
    return (now - timestamp) < fiveMinutes;
  }
}
```

**Task 1.2: Create Authentication Controller**

Create `backend/src/controllers/auth.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

const authService = new AuthService();
const userService = new UserService();

/**
 * POST /api/auth/get-message
 * Get message to sign for authentication
 */
export async function getAuthMessage(req: Request, res: Response) {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      throw new ApiError('Wallet address is required', 400);
    }

    // Validate wallet address format (0.0.xxxxx)
    if (!walletAddress.match(/^0\.0\.\d+$/)) {
      throw new ApiError('Invalid Hedera wallet address format', 400);
    }

    const message = authService.createAuthMessage(walletAddress);

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    logger.error('Get auth message error:', error);
    throw error;
  }
}

/**
 * POST /api/auth/verify
 * Verify wallet signature and issue JWT token
 */
export async function verifyAndAuthenticate(req: Request, res: Response) {
  try {
    const { walletAddress, message, signature, publicKey } = req.body;

    // Validate inputs
    if (!walletAddress || !message || !signature || !publicKey) {
      throw new ApiError('Missing required fields', 400);
    }

    // Validate message timestamp
    if (!authService.validateAuthMessage(message)) {
      throw new ApiError('Message expired or invalid', 400);
    }

    // Convert signature from hex string to Uint8Array
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
    );

    // Verify signature
    const isValid = await authService.verifyWalletSignature(
      message,
      signatureBytes,
      publicKey
    );

    if (!isValid) {
      throw new ApiError('Invalid signature', 401);
    }

    // Check if user exists
    let user = await userService.getUserByWallet(walletAddress);

    // If user doesn't exist, this is their first login
    // They'll need to complete registration
    if (!user) {
      return res.json({
        success: true,
        data: {
          needsRegistration: true,
          walletAddress
        }
      });
    }

    // Generate JWT token
    const token = authService.generateToken(
      user.id,
      user.wallet_address,
      user.role
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          role: user.role,
          displayName: user.display_name,
          profilePicture: user.profile_picture_url
        }
      }
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    throw error;
  }
}
```

### Afternoon: Authentication Middleware

**Task 1.3: Create Auth Middleware**

Create `backend/src/middleware/auth.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiError } from './errorHandler';

const authService = new AuthService();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        walletAddress: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token
 * Usage: router.get('/protected', authenticate, handler)
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = authService.verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      walletAddress: decoded.walletAddress,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(new ApiError('Invalid or expired token', 401));
  }
}

/**
 * Middleware to check user role
 * Usage: router.get('/admin', authenticate, requireRole('admin'), handler)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError('Insufficient permissions', 403));
    }

    next();
  };
}

/**
 * Middleware to verify wallet ownership
 * Ensures the authenticated user can only access their own resources
 */
export function requireWalletOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new ApiError('Not authenticated', 401));
  }

  const { walletAddress } = req.params;

  if (walletAddress !== req.user.walletAddress && req.user.role !== 'admin') {
    return next(new ApiError('Unauthorized access', 403));
  }

  next();
}
```

**Task 1.4: Update Auth Routes**

Update `backend/src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { getAuthMessage, verifyAndAuthenticate } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/get-message - Get message to sign
router.post('/get-message', getAuthMessage);

// POST /api/auth/verify - Verify signature and get JWT
router.post('/verify', verifyAndAuthenticate);

export default router;
```

**Task 1.5: Test with Postman**

Create test requests:
1. GET message: `POST http://localhost:4000/api/auth/get-message`
   - Body: `{ "walletAddress": "0.0.123456" }`
2. Verify (will fail without real signature for now)

---

## Day 2 (Tuesday): User Registration & Profile

### Morning: User Service & Database Operations

**Task 2.1: Create User Service**

Create `backend/src/services/user.service.ts`:

```typescript
import { supabase } from '../config/database';
import { logger } from '../config/logger';
import { ApiError } from '../middleware/errorHandler';

export interface CreateUserInput {
  walletAddress: string;
  role: 'buyer' | 'artist';
  displayName?: string;
  email?: string;
}

export interface UpdateUserInput {
  displayName?: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: Record<string, string>;
}

export class UserService {
  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Get user error:', error);
      throw new ApiError('Database error', 500);
    }

    return data;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Get user by ID error:', error);
      throw new ApiError('User not found', 404);
    }

    return data;
  }

  /**
   * Create new user
   */
  async createUser(input: CreateUserInput) {
    // Check if user already exists
    const existing = await this.getUserByWallet(input.walletAddress);
    if (existing) {
      throw new ApiError('User already exists', 409);
    }

    // Validate role
    if (!['buyer', 'artist'].includes(input.role)) {
      throw new ApiError('Invalid role. Must be "buyer" or "artist"', 400);
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        wallet_address: input.walletAddress,
        role: input.role,
        display_name: input.displayName || null,
        email: input.email || null
      })
      .select()
      .single();

    if (error) {
      logger.error('Create user error:', error);
      throw new ApiError('Failed to create user', 500);
    }

    logger.info(`User created: ${data.id} (${input.walletAddress})`);
    return data;
  }

  /**
   * Update user profile
   */
  async updateUser(walletAddress: string, input: UpdateUserInput) {
    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: input.displayName,
        email: input.email,
        bio: input.bio,
        profile_picture_url: input.profilePictureUrl,
        social_links: input.socialLinks,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) {
      logger.error('Update user error:', error);
      throw new ApiError('Failed to update user', 500);
    }

    return data;
  }

  /**
   * Check if wallet address is unique
   */
  async isWalletUnique(walletAddress: string): Promise<boolean> {
    const user = await this.getUserByWallet(walletAddress);
    return !user;
  }
}
```

**Task 2.2: Create User Controller**

Create `backend/src/controllers/user.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

const userService = new UserService();
const authService = new AuthService();

/**
 * POST /api/users/register
 * Register new user after wallet verification
 */
export async function registerUser(req: Request, res: Response) {
  try {
    const { walletAddress, role, displayName, email } = req.body;

    // Validate required fields
    if (!walletAddress || !role) {
      throw new ApiError('Wallet address and role are required', 400);
    }

    // Create user
    const user = await userService.createUser({
      walletAddress,
      role,
      displayName,
      email
    });

    // Generate JWT token
    const token = authService.generateToken(
      user.id,
      user.wallet_address,
      user.role
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          role: user.role,
          displayName: user.display_name
        }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
}

/**
 * GET /api/users/:walletAddress
 * Get user profile by wallet address
 */
export async function getUserProfile(req: Request, res: Response) {
  try {
    const { walletAddress } = req.params;

    const user = await userService.getUserByWallet(walletAddress);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Don't return sensitive fields
    const { id, wallet_address, role, display_name, bio, profile_picture_url, social_links, created_at } = user;

    res.json({
      success: true,
      data: {
        id,
        walletAddress: wallet_address,
        role,
        displayName: display_name,
        bio,
        profilePicture: profile_picture_url,
        socialLinks: social_links,
        createdAt: created_at
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    throw error;
  }
}

/**
 * PATCH /api/users/:walletAddress
 * Update user profile (authenticated users only)
 */
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const { walletAddress } = req.params;
    const { displayName, email, bio, profilePictureUrl, socialLinks } = req.body;

    const user = await userService.updateUser(walletAddress, {
      displayName,
      email,
      bio,
      profilePictureUrl,
      socialLinks
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        walletAddress: user.wallet_address,
        role: user.role,
        displayName: user.display_name,
        bio: user.bio,
        profilePicture: user.profile_picture_url,
        socialLinks: user.social_links
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    throw error;
  }
}
```

### Afternoon: Update Routes & Testing

**Task 2.3: Update User Routes**

Update `backend/src/routes/user.routes.ts`:

```typescript
import { Router } from 'express';
import {
  registerUser,
  getUserProfile,
  updateUserProfile
} from '../controllers/user.controller';
import { authenticate, requireWalletOwnership } from '../middleware/auth.middleware';

const router = Router();

// POST /api/users/register - Public (after wallet verification)
router.post('/register', registerUser);

// GET /api/users/:walletAddress - Public
router.get('/:walletAddress', getUserProfile);

// PATCH /api/users/:walletAddress - Protected (must own wallet)
router.patch('/:walletAddress', authenticate, requireWalletOwnership, updateUserProfile);

export default router;
```

**Task 2.4: Test with Postman**

Create Postman collection:

1. **Register User**
   ```json
   POST http://localhost:4000/api/users/register
   {
     "walletAddress": "0.0.123456",
     "role": "artist",
     "displayName": "Test Artist",
     "email": "test@example.com"
   }
   ```

2. **Get User Profile**
   ```
   GET http://localhost:4000/api/users/0.0.123456
   ```

3. **Update Profile** (requires token from registration)
   ```json
   PATCH http://localhost:4000/api/users/0.0.123456
   Headers: Authorization: Bearer <token>
   {
     "displayName": "Updated Name",
     "bio": "I am an artist from Lagos"
   }
   ```

---

## Day 3 (Wednesday): Frontend Wallet Integration

### Morning: Real Hedera Wallet Connection

**Task 3.1: Update WalletProvider**

Update `frontend/contexts/WalletProvider.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod } from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<{ signature: string; publicKey: string }>;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  walletAddress: null,
  publicKey: null,
  connect: async () => {},
  disconnect: () => {},
  signMessage: async () => ({ signature: '', publicKey: '' }),
  isConnecting: false
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null);

  // Initialize DAppConnector
  useEffect(() => {
    const connector = new DAppConnector(
      {
        name: 'AfriArt NFT Marketplace',
        description: 'Discover and collect unique African art as NFTs',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        icons: ['https://afriart.xyz/icon.png']
      },
      LedgerId.TESTNET,
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''
    );

    setDAppConnector(connector);

    // Initialize connector
    connector.init().then(() => {
      console.log('✅ Wallet connector initialized');
    });

    return () => {
      connector.disconnectAll().then(() => {
        console.log('Wallet connector closed');
      });
    };
  }, []);

  const connect = useCallback(async () => {
    if (!dAppConnector) return;

    setIsConnecting(true);
    try {
      // Open wallet selection modal
      await dAppConnector.openModal();

      // Wait for connection
      const session = dAppConnector.signers[0];
      if (session) {
        const accountId = session.getAccountId().toString();
        const pubKey = session.getAccountKey().toString();

        setWalletAddress(accountId);
        setPublicKey(pubKey);
        setIsConnected(true);

        // Store in localStorage
        localStorage.setItem('walletAddress', accountId);
        localStorage.setItem('publicKey', pubKey);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [dAppConnector]);

  const disconnect = useCallback(() => {
    if (!dAppConnector) return;

    dAppConnector.disconnectAll();
    setIsConnected(false);
    setWalletAddress(null);
    setPublicKey(null);

    localStorage.removeItem('walletAddress');
    localStorage.removeItem('publicKey');
    localStorage.removeItem('authToken');
  }, [dAppConnector]);

  const signMessage = useCallback(async (message: string) => {
    if (!dAppConnector || !dAppConnector.signers[0]) {
      throw new Error('Wallet not connected');
    }

    const signer = dAppConnector.signers[0];

    // Sign the message
    const signature = await signer.sign([Buffer.from(message)]);
    const signatureHex = Buffer.from(signature).toString('hex');

    return {
      signature: signatureHex,
      publicKey: signer.getAccountKey().toString()
    };
  }, [dAppConnector]);

  // Restore session on page load
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    const savedPublicKey = localStorage.getItem('publicKey');

    if (savedAddress && savedPublicKey) {
      setWalletAddress(savedAddress);
      setPublicKey(savedPublicKey);
      setIsConnected(true);
    }
  }, []);

  return (
    <WalletContext.Provider value={{
      isConnected,
      walletAddress,
      publicKey,
      connect,
      disconnect,
      signMessage,
      isConnecting
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
```

**Task 3.2: Create API Client Service**

Create `frontend/app/utils/apiClient.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('authToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data.data as T;
  }

  // Auth endpoints
  async getAuthMessage(walletAddress: string): Promise<{ message: string }> {
    return this.request('/api/auth/get-message', {
      method: 'POST',
      body: JSON.stringify({ walletAddress })
    });
  }

  async verifySignature(
    walletAddress: string,
    message: string,
    signature: string,
    publicKey: string
  ): Promise<{ token?: string; needsRegistration?: boolean; user?: any }> {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, message, signature, publicKey })
    });
  }

  // User endpoints
  async registerUser(data: {
    walletAddress: string;
    role: 'buyer' | 'artist';
    displayName?: string;
    email?: string;
  }): Promise<{ token: string; user: any }> {
    return this.request('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getUserProfile(walletAddress: string): Promise<any> {
    return this.request(`/api/users/${walletAddress}`);
  }

  async updateUserProfile(
    walletAddress: string,
    data: {
      displayName?: string;
      email?: string;
      bio?: string;
      profilePictureUrl?: string;
      socialLinks?: Record<string, string>;
    }
  ): Promise<any> {
    return this.request(`/api/users/${walletAddress}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
}

export const apiClient = new ApiClient(API_URL);
```

### Afternoon: Authentication Flow UI

**Task 3.3: Create Auth Hook**

Create `frontend/app/hooks/useAuth.ts`:

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletProvider';
import { apiClient } from '@/app/utils/apiClient';
import { useToast } from '@/app/components/Toast';

export function useAuth() {
  const { walletAddress, publicKey, signMessage, isConnected } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  // Check if user has valid token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser && isConnected) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, [isConnected]);

  const authenticate = useCallback(async () => {
    if (!walletAddress || !publicKey) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    setIsAuthenticating(true);

    try {
      // Step 1: Get message to sign
      const { message } = await apiClient.getAuthMessage(walletAddress);

      // Step 2: Sign message with wallet
      const { signature } = await signMessage(message);

      // Step 3: Verify signature and authenticate
      const result = await apiClient.verifySignature(
        walletAddress,
        message,
        signature,
        publicKey
      );

      if (result.needsRegistration) {
        // User needs to register
        return { needsRegistration: true };
      }

      // Save token and user
      localStorage.setItem('authToken', result.token!);
      localStorage.setItem('user', JSON.stringify(result.user));

      setIsAuthenticated(true);
      setUser(result.user);

      toast({
        title: 'Success',
        description: 'Successfully authenticated!',
        variant: 'default'
      });

      return { needsRegistration: false };
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [walletAddress, publicKey, signMessage, toast]);

  const register = useCallback(async (role: 'buyer' | 'artist', displayName?: string) => {
    if (!walletAddress) return;

    try {
      const result = await apiClient.registerUser({
        walletAddress,
        role,
        displayName
      });

      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      setIsAuthenticated(true);
      setUser(result.user);

      toast({
        title: 'Welcome!',
        description: 'Your account has been created',
        variant: 'default'
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
      throw error;
    }
  }, [walletAddress, toast]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return {
    isAuthenticated,
    user,
    isAuthenticating,
    authenticate,
    register,
    logout
  };
}
```

**Task 3.4: Update Navbar Component**

Update `frontend/app/components/Navbar.tsx` to use real authentication:

```typescript
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Wallet, LogOut, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/contexts/WalletProvider';
import { useAuth } from '@/app/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Navbar() {
  const pathname = usePathname();
  const { isConnected, walletAddress, connect, disconnect, isConnecting } = useWallet();
  const { isAuthenticated, user, authenticate, logout, isAuthenticating } = useAuth();

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Artists', href: '/artist' },
    { label: 'My Portfolio', href: '/portfolio' }
  ];

  const handleConnect = async () => {
    try {
      await connect();
      // After wallet connects, authenticate
      const result = await authenticate();

      if (result?.needsRegistration) {
        // Redirect to registration page or show modal
        // TODO: Implement registration modal
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    logout();
    disconnect();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            AfriArt
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md transition-colors ${
                  pathname === item.href
                    ? 'text-purple-400 bg-purple-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet / User */}
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : !isAuthenticated ? (
              <Button
                onClick={authenticate}
                disabled={isAuthenticating}
                variant="outline"
              >
                {isAuthenticating ? 'Authenticating...' : 'Sign In'}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <Wallet className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm text-purple-400">
                      {walletAddress?.slice(0, 8)}...
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem onClick={() => window.location.href = '/portfolio'}>
                    <User className="h-4 w-4 mr-2" />
                    My Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem onClick={handleDisconnect} className="text-red-400">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## Day 4 (Thursday): Artist Verification System

### Morning: Artist Service & Endpoints

**Task 4.1: Create Artist Service**

Create `backend/src/services/artist.service.ts`:

```typescript
import { supabase } from '../config/database';
import { logger } from '../config/logger';
import { ApiError } from '../middleware/errorHandler';

export interface SubmitVerificationInput {
  userId: string;
  kycDocuments: string[]; // IPFS URLs
  portfolioUrls: string[]; // IPFS URLs
}

export class ArtistService {
  /**
   * Submit artist verification request
   */
  async submitVerification(input: SubmitVerificationInput) {
    // Check if user is already verified or has pending verification
    const existing = await this.getArtistByUserId(input.userId);

    if (existing) {
      if (existing.verification_status === 'verified') {
        throw new ApiError('Already verified', 400);
      }
      if (existing.verification_status === 'pending') {
        throw new ApiError('Verification already pending', 400);
      }
      // If rejected, allow resubmission
    }

    const { data, error } = await supabase
      .from('artists')
      .upsert({
        user_id: input.userId,
        verification_status: 'pending',
        kyc_documents: input.kycDocuments,
        portfolio_urls: input.portfolioUrls,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Submit verification error:', error);
      throw new ApiError('Failed to submit verification', 500);
    }

    return data;
  }

  /**
   * Get artist by user ID
   */
  async getArtistByUserId(userId: string) {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Get artist error:', error);
      throw new ApiError('Database error', 500);
    }

    return data;
  }

  /**
   * Get all verified artists
   */
  async getVerifiedArtists() {
    const { data, error } = await supabase
      .from('artists')
      .select(`
        *,
        users!inner (
          wallet_address,
          display_name,
          bio,
          profile_picture_url,
          social_links
        )
      `)
      .eq('verification_status', 'verified')
      .order('verified_at', { ascending: false });

    if (error) {
      logger.error('Get verified artists error:', error);
      throw new ApiError('Failed to fetch artists', 500);
    }

    return data;
  }
}
```

**Task 4.2: Create Artist Controller**

Create `backend/src/controllers/artist.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { ArtistService } from '../services/artist.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

const artistService = new ArtistService();

/**
 * POST /api/artists/submit-verification
 * Submit KYC and portfolio for verification
 */
export async function submitVerification(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401);
    }

    const { kycDocuments, portfolioUrls } = req.body;

    if (!kycDocuments || !Array.isArray(kycDocuments) || kycDocuments.length === 0) {
      throw new ApiError('KYC documents are required', 400);
    }

    if (!portfolioUrls || !Array.isArray(portfolioUrls) || portfolioUrls.length < 3) {
      throw new ApiError('At least 3 portfolio samples are required', 400);
    }

    const artist = await artistService.submitVerification({
      userId: req.user.userId,
      kycDocuments,
      portfolioUrls
    });

    res.status(201).json({
      success: true,
      data: artist
    });
  } catch (error) {
    logger.error('Submit verification error:', error);
    throw error;
  }
}

/**
 * GET /api/artists
 * Get all verified artists
 */
export async function getArtists(req: Request, res: Response) {
  try {
    const artists = await artistService.getVerifiedArtists();

    res.json({
      success: true,
      data: artists
    });
  } catch (error) {
    logger.error('Get artists error:', error);
    throw error;
  }
}

/**
 * GET /api/artists/:id
 * Get artist details
 */
export async function getArtistById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const artist = await artistService.getArtistByUserId(id);

    if (!artist) {
      throw new ApiError('Artist not found', 404);
    }

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    logger.error('Get artist error:', error);
    throw error;
  }
}
```

### Afternoon: Update Routes & Testing

**Task 4.3: Update Artist Routes**

Update `backend/src/routes/artist.routes.ts`:

```typescript
import { Router } from 'express';
import {
  submitVerification,
  getArtists,
  getArtistById
} from '../controllers/artist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/artists/submit-verification - Protected
router.post('/submit-verification', authenticate, submitVerification);

// GET /api/artists - Public
router.get('/', getArtists);

// GET /api/artists/:id - Public
router.get('/:id', getArtistById);

export default router;
```

**Task 4.4: Test Artist Endpoints**

Postman tests:

1. **Submit Verification**
   ```json
   POST http://localhost:4000/api/artists/submit-verification
   Headers: Authorization: Bearer <token>
   {
     "kycDocuments": [
       "ipfs://QmXxxx...",
       "ipfs://QmYyyy..."
     ],
     "portfolioUrls": [
       "ipfs://QmAaa...",
       "ipfs://QmBbb...",
       "ipfs://QmCcc..."
     ]
   }
   ```

2. **Get Artists**
   ```
   GET http://localhost:4000/api/artists
   ```

---

## Day 5 (Friday): Testing & Integration

### Morning: End-to-End Testing

**Task 5.1: Manual Testing Checklist**

Test complete authentication flow:

#### 1. Wallet Connection
- [ ] Open app at http://localhost:3000
- [ ] Click "Connect Wallet"
- [ ] Select HashPack from modal
- [ ] Approve connection in wallet
- [ ] Verify wallet address displays in navbar

#### 2. New User Registration
- [ ] Click "Sign In" button after wallet connects
- [ ] Wallet prompts for message signature
- [ ] Sign message in wallet
- [ ] Backend verifies signature
- [ ] Returns `needsRegistration: true`
- [ ] Registration modal appears
- [ ] Select role (buyer/artist)
- [ ] Enter display name
- [ ] Submit registration
- [ ] JWT token stored in localStorage
- [ ] User object stored in localStorage
- [ ] Navbar shows authenticated state

#### 3. Returning User Login
- [ ] Clear localStorage and refresh
- [ ] Connect wallet
- [ ] Click "Sign In"
- [ ] Sign message
- [ ] Receive JWT token
- [ ] No registration needed
- [ ] Redirected to appropriate page

#### 4. Profile Management
- [ ] Navigate to /portfolio
- [ ] Click "Edit Profile"
- [ ] Update display name
- [ ] Add bio
- [ ] Add social links (Twitter, Instagram)
- [ ] Save changes
- [ ] Verify changes persist in database
- [ ] Verify changes show immediately in UI

#### 5. Artist Verification
- [ ] User with artist role logs in
- [ ] Navigate to artist verification page
- [ ] Upload KYC documents (use IPFS URLs for testing)
- [ ] Upload portfolio samples (minimum 3)
- [ ] Submit verification
- [ ] Status shows "pending" in database
- [ ] Confirmation message displayed

#### 6. Protected Routes
- [ ] Access protected route without token → 401 error
- [ ] Access another user's profile edit → 403 error
- [ ] Access admin route as non-admin → 403 error
- [ ] Token expires → 401 error, prompt to re-authenticate

### Afternoon: Bug Fixes & Polish

**Task 5.2: Common Issues to Fix**

1. **Token Expiration Handling**

Add to `apiClient.ts`:
```typescript
private async request<T>(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();

    // Handle token expiration
    if (response.status === 401 && data.error?.message.includes('expired')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Session expired. Please sign in again.');
    }

    return data.data;
  } catch (error) {
    throw error;
  }
}
```

2. **Network Error Handling**

Add retry logic:
```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

3. **Loading States**

Ensure all buttons are disabled during async operations:
```typescript
<Button onClick={handleAuth} disabled={isAuthenticating}>
  {isAuthenticating ? 'Authenticating...' : 'Sign In'}
</Button>
```

**Task 5.3: Create Postman Collection**

Export Postman collection with all endpoints:

1. Auth
   - Get Auth Message
   - Verify Signature

2. Users
   - Register User
   - Get User Profile
   - Update User Profile

3. Artists
   - Submit Verification
   - Get All Artists
   - Get Artist by ID

Save as `backend/docs/AfriArt.postman_collection.json`

**Task 5.4: Update Documentation**

Create `backend/docs/AUTHENTICATION.md`:

```markdown
# Authentication Flow

## Overview
AfriArt uses wallet-based authentication with JWT tokens.

## Flow Diagram
1. User connects Hedera wallet (HashPack/Blade)
2. Frontend requests authentication message from backend
3. User signs message with private key in wallet
4. Frontend sends signed message to backend
5. Backend verifies signature using public key
6. Backend issues JWT token (7-day expiry)
7. Frontend stores token in localStorage
8. Token included in Authorization header for protected routes

## API Endpoints

### Get Authentication Message
`POST /api/auth/get-message`
```

---

## Week 2 Deliverables Checklist

### Backend ✅
- [x] Authentication service (signature verification, JWT)
- [x] User service (CRUD operations)
- [x] Artist service (verification submission)
- [x] Auth middleware (protect routes, role checks)
- [x] User endpoints (register, get, update)
- [x] Artist endpoints (submit verification, list)
- [x] Database operations working
- [x] Error handling implemented
- [x] Logging configured

### Frontend ✅
- [x] Real wallet connection (HashPack/Blade via WalletConnect)
- [x] Authentication flow (sign message)
- [x] Registration flow
- [x] Profile editing
- [x] API client service
- [x] Auth state management (useAuth hook)
- [x] Protected routes
- [x] Error handling with toasts
- [x] Loading states

### Testing ✅
- [x] Postman collection created
- [x] Manual testing completed
- [x] Database verified
- [x] Wallet integration tested
- [x] End-to-end flow tested

### Documentation ✅
- [x] API endpoints documented
- [x] Authentication flow explained
- [x] Common issues documented
- [x] Postman collection exported

---

## Success Metrics

By end of Week 2, you should have:

- [ ] **5+ test users registered** in database
- [ ] **Both buyer and artist roles** working
- [ ] **Wallet signature verification** 100% success rate
- [ ] **JWT auth working** on all protected routes
- [ ] **No critical bugs** blocking Week 3
- [ ] **Backend running** on port 4000
- [ ] **Frontend running** on port 3000
- [ ] **Database** populated with test data

---

## Troubleshooting

### Issue: Signature verification fails

**Check:**
- Message format matches exactly
- Signature is hex string
- Public key format correct
- No extra characters in strings

**Solution:**
```typescript
// Log all values before verification
console.log('Message:', message);
console.log('Signature:', signature);
console.log('Public Key:', publicKey);
```

### Issue: JWT token invalid

**Check:**
- JWT_SECRET is set in .env
- Token not expired (check timestamp)
- Token format is "Bearer <token>"

### Issue: CORS errors

**Check:**
- CORS_ORIGIN matches frontend URL exactly
- No trailing slashes
- Backend running on correct port

---

## Next Steps

After completing Week 2:

1. **Review** all code and ensure tests pass
2. **Commit** changes to git
3. **Move to Week 3**: IPFS Integration
4. **Prepare for file uploads**: Images and videos

---

## Resources

- [Hedera SDK Docs](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [JWT.io](https://jwt.io) - Debug JWT tokens
- [WalletConnect Docs](https://docs.walletconnect.com)
- [Supabase Docs](https://supabase.com/docs)

---

**You're ready to start Week 2! 🚀**

Begin with Day 1, Task 1.1: Create Authentication Service
