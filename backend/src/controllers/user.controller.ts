import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger';

/**
 * POST /api/users/register
 * Register a new user after wallet verification
 */
export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { walletAddress, role, displayName, email, bio, profilePictureUrl, socialLinks } =
      req.body;

    // Validate required fields
    if (!walletAddress || !role) {
      res.status(400).json({
        success: false,
        error: 'Wallet address and role are required',
      });
      return;
    }

    // Validate role
    const validRoles = ['buyer', 'artist', 'admin'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    // Validate wallet address format
    const walletRegex = /^0\.0\.\d+$/;
    if (!walletRegex.test(walletAddress)) {
      res.status(400).json({
        success: false,
        error: 'Invalid Hedera wallet address format',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await userService.getUserByWallet(walletAddress);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this wallet address already exists',
      });
      return;
    }

    // Create user
    const user = await userService.createUser({
      walletAddress,
      role,
      displayName,
      email,
      bio,
      profilePictureUrl,
      socialLinks,
    });

    // Generate JWT token
    const token = authService.generateToken(user.id, user.walletAddress, user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          displayName: user.displayName,
          email: user.email,
          bio: user.bio,
          profilePictureUrl: user.profilePictureUrl,
          socialLinks: user.socialLinks,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error registering user');
    next(error);
  }
}

/**
 * GET /api/users/:walletAddress
 * Get user profile by wallet address
 */
export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    const user = await userService.getUserByWallet(walletAddress);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Get user statistics
    const stats = await userService.getUserStats(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          displayName: user.displayName,
          email: user.email,
          bio: user.bio,
          profilePictureUrl: user.profilePictureUrl,
          socialLinks: user.socialLinks,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting user profile');
    next(error);
  }
}

/**
 * PATCH /api/users/:walletAddress
 * Update user profile (authenticated user only)
 */
export async function updateUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { walletAddress } = req.params;
    const { displayName, email, bio, profilePictureUrl, socialLinks } = req.body;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    // Update user
    const user = await userService.updateUser(walletAddress, {
      displayName,
      email,
      bio,
      profilePictureUrl,
      socialLinks,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          displayName: user.displayName,
          email: user.email,
          bio: user.bio,
          profilePictureUrl: user.profilePictureUrl,
          socialLinks: user.socialLinks,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error updating user profile');
    next(error);
  }
}

/**
 * GET /api/users
 * Get all users (with optional filters)
 */
export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { role } = req.query;

    let users;

    if (role === 'artist') {
      // Get only verified artists
      users = await userService.getArtists(false);
    } else {
      // For now, just return artists. Can be extended for other roles
      res.status(400).json({
        success: false,
        error: 'Please specify role=artist',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          walletAddress: user.walletAddress,
          role: user.role,
          displayName: user.displayName,
          bio: user.bio,
          profilePictureUrl: user.profilePictureUrl,
          socialLinks: user.socialLinks,
          createdAt: user.createdAt,
        })),
        count: users.length,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting users');
    next(error);
  }
}

/**
 * DELETE /api/users/:walletAddress
 * Delete user account (admin only or self-deletion)
 */
export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    // Check if user exists
    const user = await userService.getUserByWallet(walletAddress);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Delete user
    await userService.deleteUser(walletAddress);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting user');
    next(error);
  }
}

/**
 * GET /api/users/:walletAddress/stats
 * Get user statistics
 */
export async function getUserStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    const user = await userService.getUserByWallet(walletAddress);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const stats = await userService.getUserStats(user.id);

    res.json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting user stats');
    next(error);
  }
}
