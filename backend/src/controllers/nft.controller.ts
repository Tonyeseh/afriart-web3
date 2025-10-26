import { Request, Response, NextFunction, RequestHandler } from 'express';
import { nftService } from '../services/nft.service';
import { logger } from '../config/logger';
import multer from 'multer';
import { supabase } from '../config/database';

// Multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG and JPEG allowed.'));
    }
  },
});

export const uploadMiddleware: RequestHandler = upload.single('image');

/**
 * POST /api/nfts/mint
 * Mint new NFT
 */
export async function mintNFT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { title, description, technique, material } = req.body;
    const imageFile = (req as any).file;

    // Validation
    if (!title || !description) {
      res.status(400).json({
        success: false,
        error: 'Title and description are required',
      });
      return;
    }

    if (!imageFile) {
      res.status(400).json({
        success: false,
        error: 'Image file is required',
      });
      return;
    }

    // Only artists can mint
    if (user.role !== 'artist') {
      res.status(403).json({
        success: false,
        error: 'Only verified artists can mint NFTs',
      });
      return;
    }

    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('display_name, wallet_address')
      .eq('id', user.userId)
      .single();

    // Mint NFT
    const result = await nftService.mintNFT({
      title,
      description,
      creatorId: user.userId,
      creatorWallet: user.walletAddress,
      creatorName: userData?.display_name || 'Unknown Artist',
      imageFile: imageFile.buffer,
      technique,
      material,
    });

    res.status(201).json({
      success: true,
      data: {
        nft: result.nft,
        transaction: result.transaction,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error minting NFT');
    next(error);
  }
}