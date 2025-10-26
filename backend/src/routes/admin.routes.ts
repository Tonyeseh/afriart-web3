import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getPendingVerifications,
  approveArtist,
  rejectArtist,
  getPlatformStats,
} from '../controllers/admin.controller';

const router: Router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * @swagger
 * /api/admin/pending-verifications:
 *   get:
 *     summary: Get all pending artist verification requests
 *     description: Returns list of artists awaiting verification approval
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending verifications retrieved successfully
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
 *                     artists:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           verification_status:
 *                             type: string
 *                             example: pending
 *                           kyc_documents:
 *                             type: array
 *                             items:
 *                               type: string
 *                           portfolio_urls:
 *                             type: array
 *                             items:
 *                               type: string
 *                           submitted_at:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               display_name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               wallet_address:
 *                                 type: string
 *                     count:
 *                       type: number
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Requires admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/pending-verifications', getPendingVerifications);

/**
 * @swagger
 * /api/admin/artists/{id}/approve:
 *   patch:
 *     summary: Approve an artist verification request
 *     description: |
 *       Approves a pending artist verification and updates their role to 'artist'.
 *       Artists can then mint and sell NFTs on the platform.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: Artist approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Artist verification approved
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         verification_status:
 *                           type: string
 *                           example: verified
 *                         verified_at:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Artist is already verified or rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Requires admin role
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/artists/:id/approve', approveArtist);

/**
 * @swagger
 * /api/admin/artists/{id}/reject:
 *   patch:
 *     summary: Reject an artist verification request
 *     description: Rejects a pending artist verification with a reason
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection (minimum 10 characters)
 *                 example: Portfolio does not meet quality standards. Please submit high-resolution images.
 *                 minLength: 10
 *     responses:
 *       200:
 *         description: Artist rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Artist verification rejected
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         verification_status:
 *                           type: string
 *                           example: rejected
 *                         rejection_reason:
 *                           type: string
 *       400:
 *         description: Invalid request or artist already processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Requires admin role
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/artists/:id/reject', rejectArtist);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform statistics
 *     description: Returns comprehensive platform statistics including users, NFTs, sales, and recent activity
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                           example: 1250
 *                         totalArtists:
 *                           type: number
 *                           example: 150
 *                         pendingArtists:
 *                           type: number
 *                           example: 12
 *                         totalNFTs:
 *                           type: number
 *                           example: 3500
 *                         listedNFTs:
 *                           type: number
 *                           example: 1200
 *                         totalSales:
 *                           type: number
 *                           example: 450
 *                         totalVolumeHBAR:
 *                           type: number
 *                           example: 125000.50
 *                         totalFeesCollectedHBAR:
 *                           type: number
 *                           example: 2500.01
 *                         avgNFTPriceHBAR:
 *                           type: number
 *                           example: 277.78
 *                     recentActivity:
 *                       type: object
 *                       properties:
 *                         recentSales:
 *                           type: array
 *                           description: Last 10 sales
 *                           items:
 *                             type: object
 *                         recentNFTs:
 *                           type: array
 *                           description: Last 10 minted NFTs
 *                           items:
 *                             type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Requires admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', getPlatformStats);

export default router;
