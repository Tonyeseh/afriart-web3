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

/**
 * GET /api/nfts
 * List all NFTs with filters, pagination, and sorting
 */
export async function listNFTs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      technique,
      material,
      priceMin,
      priceMax,
      search,
      page = '1',
      limit = '20',
      sortBy = 'created_at',
      sortOrder = 'desc',
      isListed,
    } = req.query;

    // Build query
    let query = supabase
      .from('nfts')
      .select('*, creator:users!creator_id(id, wallet_address, display_name, profile_picture_url)', {
        count: 'exact',
      });

    // Apply filters
    if (technique) {
      query = query.eq('art_technique', technique);
    }

    if (material) {
      query = query.eq('art_material', material);
    }

    if (priceMin) {
      query = query.gte('price_hbar', parseFloat(priceMin as string));
    }

    if (priceMax) {
      query = query.lte('price_hbar', parseFloat(priceMax as string));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (isListed !== undefined) {
      query = query.eq('is_listed', isListed === 'true');
    }

    // Apply sorting
    const validSortFields = ['created_at', 'price_hbar', 'title', 'minted_at'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    query = query.order(sortField as string, {
      ascending: sortOrder === 'asc',
    });

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    query = query.range(offset, offset + limitNum - 1);

    const { data: nfts, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      data: {
        nfts: nfts || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error listing NFTs');
    next(error);
  }
}

/**
 * GET /api/nfts/:id
 * Get single NFT by ID
 */
export async function getNFT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const { data: nft, error } = await supabase
      .from('nfts')
      .select('*, creator:users!creator_id(id, wallet_address, display_name, profile_picture_url, bio), owner:users!owner_id(id, wallet_address, display_name)')
      .eq('id', id)
      .single();

    if (error || !nft) {
      res.status(404).json({
        success: false,
        error: 'NFT not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { nft },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting NFT');
    next(error);
  }
}

/**
 * PATCH /api/nfts/:id/list
 * List or unlist NFT for sale
 */
export async function toggleListing(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { isListed, price } = req.body;

    // Validate
    if (typeof isListed !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'isListed must be a boolean',
      });
      return;
    }

    // If listing, price is required
    if (isListed && !price) {
      res.status(400).json({
        success: false,
        error: 'Price is required when listing NFT',
      });
      return;
    }

    if (isListed && (parseFloat(price) <= 0 || parseFloat(price) > 1000000)) {
      res.status(400).json({
        success: false,
        error: 'Price must be between 0 and 1,000,000 HBAR',
      });
      return;
    }

    // Check NFT exists and user is owner
    const { data: nft, error: fetchError } = await supabase
      .from('nfts')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !nft) {
      res.status(404).json({
        success: false,
        error: 'NFT not found',
      });
      return;
    }

    if (nft.owner_id !== user.userId) {
      res.status(403).json({
        success: false,
        error: 'Only the NFT owner can list/unlist',
      });
      return;
    }

    // Update listing status
    const updateData: any = {
      is_listed: isListed,
      updated_at: new Date().toISOString(),
    };

    if (isListed) {
      updateData.price_hbar = parseFloat(price);
      updateData.listed_at = new Date().toISOString();
    } else {
      updateData.price_hbar = null;
      updateData.listed_at = null;
    }

    const { data: updatedNFT, error: updateError } = await supabase
      .from('nfts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    res.status(200).json({
      success: true,
      data: { nft: updatedNFT },
      message: isListed ? 'NFT listed for sale' : 'NFT unlisted',
    });
  } catch (error) {
    logger.error({ error }, 'Error toggling NFT listing');
    next(error);
  }
}

/**
 * PATCH /api/nfts/:id/price
 * Update NFT price
 */
export async function updatePrice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { price } = req.body;

    // Validate price
    if (!price || parseFloat(price) <= 0) {
      res.status(400).json({
        success: false,
        error: 'Valid price is required',
      });
      return;
    }

    if (parseFloat(price) > 1000000) {
      res.status(400).json({
        success: false,
        error: 'Price must not exceed 1,000,000 HBAR',
      });
      return;
    }

    // Check NFT exists and user is owner
    const { data: nft, error: fetchError } = await supabase
      .from('nfts')
      .select('owner_id, is_listed')
      .eq('id', id)
      .single();

    if (fetchError || !nft) {
      res.status(404).json({
        success: false,
        error: 'NFT not found',
      });
      return;
    }

    if (nft.owner_id !== user.userId) {
      res.status(403).json({
        success: false,
        error: 'Only the NFT owner can update the price',
      });
      return;
    }

    // Update price
    const { data: updatedNFT, error: updateError } = await supabase
      .from('nfts')
      .update({
        price_hbar: parseFloat(price),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    res.status(200).json({
      success: true,
      data: { nft: updatedNFT },
      message: 'Price updated successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error updating NFT price');
    next(error);
  }
}
