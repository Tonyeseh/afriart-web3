import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { mintNFT, uploadMiddleware } from '../controllers/nft.controller';

const router: Router = Router();

// Mint NFT (artist only)
router.post(
  '/mint',
  authenticate,
  requireRole('artist'),
  uploadMiddleware,
  mintNFT
);

export default router;