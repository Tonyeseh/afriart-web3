import { Request, Response, NextFunction } from 'express';
import { purchaseService } from '../services/purchase.service';
import { logger } from '../config/logger';

/**
 * POST /api/nfts/:id/purchase
 * Purchase an NFT
 */
export async function purchaseNFT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { expectedPrice } = req.body;

    // Validation
    if (!expectedPrice || parseFloat(expectedPrice) <= 0) {
      res.status(400).json({
        success: false,
        error: 'Valid expected price is required',
      });
      return;
    }

    // Execute purchase
    const result = await purchaseService.purchaseNFT({
      nftId: id,
      buyerId: user.userId,
      buyerWalletAddress: user.walletAddress,
      expectedPrice: parseFloat(expectedPrice),
    });

    res.status(200).json({
      success: true,
      data: {
        sale: result.sale,
        transactionId: result.transactionId,
      },
      message: 'NFT purchased successfully',
    });
  } catch (error) {
    logger.error({ error, nftId: req.params.id }, 'Error purchasing NFT');
    next(error);
  }
}

/**
 * GET /api/purchases/my-purchases
 * Get user's purchase history
 */
export async function getMyPurchases(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    const purchases = await purchaseService.getUserPurchases(user.userId);

    res.status(200).json({
      success: true,
      data: { purchases },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching purchase history');
    next(error);
  }
}

/**
 * GET /api/sales/my-sales
 * Get user's sales history
 */
export async function getMySales(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as any).user;

    const sales = await purchaseService.getUserSales(user.userId);

    res.status(200).json({
      success: true,
      data: { sales },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching sales history');
    next(error);
  }
}
