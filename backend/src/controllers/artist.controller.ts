import { Request, Response, NextFunction } from 'express';
import { artistService } from '../services/artist.service';
import { userService } from '../services/user.service';
import { logger } from '../config/logger';

/**
 * POST /api/artists/submit-verification
 * Submit artist verification with KYC documents and portfolio
 */
export async function submitVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { kycDocuments, portfolioUrls } = req.body;

    // Validation
    if (!kycDocuments || !Array.isArray(kycDocuments) || kycDocuments.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one KYC document is required',
      });
      return;
    }

    if (!portfolioUrls || !Array.isArray(portfolioUrls) || portfolioUrls.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one portfolio image is required',
      });
      return;
    }

    // Only artists can submit verification
    if (user.role !== 'artist') {
      res.status(403).json({
        success: false,
        error: 'Only users with artist role can submit verification',
      });
      return;
    }

    // Submit verification
    const artist = await artistService.submitVerification({
      userId: user.userId,
      kycDocuments,
      portfolioUrls,
    });

    res.status(201).json({
      success: true,
      data: {
        artist: {
          id: artist.id,
          userId: artist.userId,
          verificationStatus: artist.verificationStatus,
          submittedAt: artist.submittedAt,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error submitting artist verification');
    next(error);
  }
}

/**
 * GET /api/artists/:id
 * Get artist details by artist ID
 */
export async function getArtistById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Artist ID is required',
      });
      return;
    }

    const artist = await artistService.getArtistById(id);

    if (!artist) {
      res.status(404).json({
        success: false,
        error: 'Artist not found',
      });
      return;
    }

    // Get associated user details
    const user = await userService.getUserById(artist.userId);

    res.json({
      success: true,
      data: {
        artist: {
          id: artist.id,
          verificationStatus: artist.verificationStatus,
          portfolioUrls: artist.portfolioUrls,
          submittedAt: artist.submittedAt,
          verifiedAt: artist.verifiedAt,
          rejectionReason: artist.rejectionReason,
        },
        user: user ? {
          id: user.id,
          walletAddress: user.walletAddress,
          displayName: user.displayName,
          bio: user.bio,
          profilePictureUrl: user.profilePictureUrl,
          socialLinks: user.socialLinks,
        } : null,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting artist');
    next(error);
  }
}

/**
 * GET /api/artists
 * Get all verified artists
 */
export async function getVerifiedArtists(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const artists = await artistService.getVerifiedArtists();

    // Get user details for each artist
    const artistsWithUsers = await Promise.all(
      artists.map(async (artist) => {
        const user = await userService.getUserById(artist.userId);
        return {
          id: artist.id,
          verificationStatus: artist.verificationStatus,
          portfolioUrls: artist.portfolioUrls,
          verifiedAt: artist.verifiedAt,
          user: user ? {
            id: user.id,
            walletAddress: user.walletAddress,
            displayName: user.displayName,
            bio: user.bio,
            profilePictureUrl: user.profilePictureUrl,
            socialLinks: user.socialLinks,
          } : null,
        };
      })
    );

    res.json({
      success: true,
      data: {
        artists: artistsWithUsers,
        count: artistsWithUsers.length,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting verified artists');
    next(error);
  }
}

/**
 * GET /api/artists/me
 * Get current authenticated artist's verification status
 */
export async function getMyArtistProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    if (user.role !== 'artist') {
      res.status(403).json({
        success: false,
        error: 'Only artists can access this endpoint',
      });
      return;
    }

    const artist = await artistService.getArtistByUserId(user.userId);

    if (!artist) {
      res.status(404).json({
        success: false,
        error: 'Artist profile not found. Please submit verification first.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        artist: {
          id: artist.id,
          verificationStatus: artist.verificationStatus,
          kycDocuments: artist.kycDocuments,
          portfolioUrls: artist.portfolioUrls,
          submittedAt: artist.submittedAt,
          verifiedAt: artist.verifiedAt,
          rejectionReason: artist.rejectionReason,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting artist profile');
    next(error);
  }
}
