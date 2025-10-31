import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { supabase } from '../config/database';
import { logger } from '../config/logger';

type AuthPayload =  {timestamp: string, message: string, walletAddress: string}

/**
 * GET /api/auth/message
 * Generate authentication message for wallet to sign
 */
export async function getAuthMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    // Validate wallet address format (Hedera format: 0.0.xxxxx)
    const walletRegex = /^0\.0\.\d+$/;
    if (!walletRegex.test(walletAddress)) {
      res.status(400).json({
        success: false,
        error: 'Invalid Hedera wallet address format. Expected: 0.0.xxxxx',
      });
      return;
    }

    const authMessage = authService.createAuthMessage(walletAddress);

    res.json({
      success: true,
      data: {
        message: authMessage.message,
        timestamp: authMessage.timestamp,
        walletAddress: authMessage.walletAddress,
        expiresInMinutes: 5,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error generating auth message');
    next(error);
  }
}

/**
 * POST /api/auth/verify
 * Verify wallet signature and authenticate user
 */
export async function verifyAndAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { walletAddress, message, signature, evmAddress } = req.body;

    logger.info({ walletAddress, evmAddress, messagePreview: message?.substring(0, 50) }, 'Verify request received');

    // Validate required fields
    if (!walletAddress || !message || !signature || !evmAddress) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress (Hedera), message, signature, evmAddress (EVM)',
      });
      return;
    }

    // Validate Hedera wallet address format (0.0.xxxxx)
    const hederaWalletRegex = /^0\.0\.\d+$/;
    if (!hederaWalletRegex.test(walletAddress)) {
      res.status(400).json({
        success: false,
        error: 'Invalid Hedera wallet address format. Expected: 0.0.xxxxx',
      });
      return;
    }

    // Validate EVM address format (0x + 40 hex chars)
    const evmAddressRegex = /^0x[0-9a-fA-F]{40}$/;
    if (!evmAddressRegex.test(evmAddress)) {
      res.status(400).json({
        success: false,
        error: 'Invalid EVM address format. Expected: 0x + 40 hex characters',
      });
      return;
    }

    // Step 1: Verify signature using EIP-191 format
    // This will recover the address from the signature and compare with evmAddress
    const isValidSignature = await authService.verifyWalletSignature(
      message,
      signature,
      evmAddress
    );

    if (!isValidSignature) {
      logger.warn({ evmAddress, walletAddress }, 'Invalid signature verification');
      res.status(401).json({
        success: false,
        error: 'Invalid signature. Please try signing again.',
      });
      return;
    }

    logger.info({ walletAddress, evmAddress }, 'Signature verified successfully');

    // Step 2: Check if user exists in database (by Hedera wallet address)
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, wallet_address, role, display_name, email, profile_picture_url')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      logger.error({ error: userError }, 'Database error checking user');
      throw new Error('Database error');
    }

    // Step 3: If user doesn't exist, indicate registration needed
    if (!existingUser) {
      logger.info({ walletAddress, evmAddress }, 'New user needs registration');
      res.json({
        success: true,
        needsRegistration: true,
        data: {
          walletAddress,
          evmAddress,
        },
      });
      return;
    }

    // Step 4: Generate JWT token for existing user
    const token = authService.generateToken(
      existingUser.id,
      existingUser.wallet_address,
      existingUser.role
    );

    logger.info({ userId: existingUser.id, walletAddress }, 'User authenticated successfully');

    res.json({
      success: true,
      needsRegistration: false,
      data: {
        token,
        user: {
          id: existingUser.id,
          walletAddress: existingUser.wallet_address,
          role: existingUser.role,
          displayName: existingUser.display_name,
          email: existingUser.email,
          profilePictureUrl: existingUser.profile_picture_url,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error verifying authentication');
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal mainly, but can track for audit)
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // In a JWT-based system, logout is mainly client-side (remove token)
    // But we can log it for audit purposes
    const user = (req as any).user;

    if (user) {
      logger.info(
        { userId: user.userId, walletAddress: user.walletAddress },
        'User logged out'
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error during logout');
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user details
 */
export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    // Fetch fresh user data from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, wallet_address, role, display_name, email, bio, profile_picture_url, social_links, created_at')
      .eq('id', user.userId)
      .single();

    if (error || !userData) {
      logger.error({ error, userId: user.userId }, 'Error fetching user data');
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          walletAddress: userData.wallet_address,
          role: userData.role,
          displayName: userData.display_name,
          email: userData.email,
          bio: userData.bio,
          profilePictureUrl: userData.profile_picture_url,
          socialLinks: userData.social_links,
          createdAt: userData.created_at,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting current user');
    next(error);
  }
}
