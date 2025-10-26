import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getMyPurchases } from '../controllers/purchase.controller';

const router: Router = Router();

/**
 * @swagger
 * /api/purchases/my-purchases:
 *   get:
 *     summary: Get user's purchase history
 *     description: Returns all NFTs purchased by the authenticated user
 *     tags: [Purchases]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     purchases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           nft_id:
 *                             type: string
 *                             format: uuid
 *                           seller_id:
 *                             type: string
 *                             format: uuid
 *                           buyer_id:
 *                             type: string
 *                             format: uuid
 *                           sale_price_hbar:
 *                             type: string
 *                             example: "100.00"
 *                           platform_fee_hbar:
 *                             type: string
 *                             example: "2.00"
 *                           transaction_id:
 *                             type: string
 *                           status:
 *                             type: string
 *                             example: completed
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           nft:
 *                             type: object
 *                             description: NFT details including creator info
 *                           seller:
 *                             type: object
 *                             description: Seller user details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-purchases', authenticate, getMyPurchases);

export default router;
