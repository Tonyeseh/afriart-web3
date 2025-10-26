import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getMySales } from '../controllers/purchase.controller';

const router: Router = Router();

/**
 * @swagger
 * /api/sales/my-sales:
 *   get:
 *     summary: Get user's sales history
 *     description: Returns all NFTs sold by the authenticated user
 *     tags: [Sales]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Sales history retrieved successfully
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
 *                     sales:
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
 *                           artist_receives_hbar:
 *                             type: string
 *                             example: "98.00"
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
 *                           buyer:
 *                             type: object
 *                             description: Buyer user details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-sales', authenticate, getMySales);

export default router;
