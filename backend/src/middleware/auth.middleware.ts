import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger';

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
 * Middleware to authenticate requests using JWT token
 * Adds user object to request if valid token provided
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authentication token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = authService.verifyToken(token);

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        walletAddress: decoded.walletAddress,
        role: decoded.role,
      };

      logger.debug(
        { userId: decoded.userId, walletAddress: decoded.walletAddress },
        'User authenticated'
      );

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid token';

      res.status(401).json({
        success: false,
        error: errorMessage,
      });
      return;
    }
  } catch (error) {
    logger.error({ error }, 'Error in authentication middleware');
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
}

/**
 * Middleware to require specific role(s)
 * Must be used after authenticate middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        {
          userId: req.user.userId,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
        'Insufficient permissions'
      );

      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to ensure user is accessing their own resources
 * Checks if walletAddress in request params matches authenticated user
 * Admins can access any resource
 */
export function requireWalletOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const { walletAddress } = req.params;

  if (!walletAddress) {
    res.status(400).json({
      success: false,
      error: 'Wallet address parameter required',
    });
    return;
  }

  // Admins can access any resource
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Check if user is accessing their own resource
  if (req.user.walletAddress !== walletAddress) {
    logger.warn(
      {
        userId: req.user.userId,
        userWallet: req.user.walletAddress,
        requestedWallet: walletAddress,
      },
      'Attempted to access another user\'s resource'
    );

    res.status(403).json({
      success: false,
      error: 'You can only access your own resources',
    });
    return;
  }

  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token provided, but doesn't fail if missing
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = authService.verifyToken(token);

      req.user = {
        userId: decoded.userId,
        walletAddress: decoded.walletAddress,
        role: decoded.role,
      };

      logger.debug(
        { userId: decoded.userId },
        'Optional authentication successful'
      );
    } catch (error) {
      // Invalid token, but don't fail - just continue without user
      logger.debug('Optional authentication failed, continuing without user');
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Error in optional authentication middleware');
    // Don't fail on error, just continue
    next();
  }
}

/**
 * Middleware to verify user exists and is active
 * Must be used after authenticate middleware
 */
export async function requireActiveUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Additional checks can be added here:
  // - Check if user account is suspended
  // - Check if user has completed required verifications
  // - Check if user has agreed to latest terms

  // For now, just pass through
  next();
}
