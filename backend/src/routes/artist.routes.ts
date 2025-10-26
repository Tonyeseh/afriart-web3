import { Router } from 'express';
import {
  submitVerification,
  getArtistById,
  getVerifiedArtists,
  getMyArtistProfile,
} from '../controllers/artist.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router: Router = Router();

/**
 * @swagger
 * /api/artists/submit-verification:
 *   post:
 *     summary: Submit artist verification
 *     description: Submit KYC documents and portfolio for artist verification. Only users with 'artist' role can submit.
 *     tags: [Artists]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kycDocuments
 *               - portfolioUrls
 *             properties:
 *               kycDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of IPFS URLs for KYC documents (ID, proof of address, etc.)
 *                 example: ['ipfs://QmXyZ123...', 'ipfs://QmAbc456...']
 *                 minItems: 1
 *               portfolioUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of IPFS URLs for portfolio artwork samples
 *                 example: ['ipfs://QmDef789...', 'ipfs://QmGhi012...']
 *                 minItems: 1
 *     responses:
 *       201:
 *         description: Verification submitted successfully
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
 *                     artist:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         userId:
 *                           type: string
 *                           format: uuid
 *                         verificationStatus:
 *                           type: string
 *                           enum: [pending, verified, rejected]
 *                           example: pending
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only artists can submit verification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/submit-verification', authenticate, requireRole('artist'), submitVerification);

/**
 * @swagger
 * /api/artists/me:
 *   get:
 *     summary: Get my artist profile
 *     description: Get the current authenticated artist's verification status and details
 *     tags: [Artists]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Artist profile retrieved successfully
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
 *                     artist:
 *                       $ref: '#/components/schemas/Artist'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only artists can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Artist profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, requireRole('artist'), getMyArtistProfile);

/**
 * @swagger
 * /api/artists:
 *   get:
 *     summary: Get all verified artists
 *     description: Retrieve a list of all artists with 'verified' status, including their user profiles
 *     tags: [Artists]
 *     responses:
 *       200:
 *         description: Verified artists retrieved successfully
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
 *                           verificationStatus:
 *                             type: string
 *                             example: verified
 *                           portfolioUrls:
 *                             type: array
 *                             items:
 *                               type: string
 *                           verifiedAt:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               walletAddress:
 *                                 type: string
 *                                 example: '0.0.12345'
 *                               displayName:
 *                                 type: string
 *                               bio:
 *                                 type: string
 *                               profilePictureUrl:
 *                                 type: string
 *                               socialLinks:
 *                                 type: object
 *                     count:
 *                       type: number
 *                       example: 25
 */
router.get('/', getVerifiedArtists);

/**
 * @swagger
 * /api/artists/{id}:
 *   get:
 *     summary: Get artist by ID
 *     description: Retrieve detailed information about a specific artist by their artist ID, including user profile
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID (UUID)
 *     responses:
 *       200:
 *         description: Artist retrieved successfully
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
 *                     artist:
 *                       $ref: '#/components/schemas/Artist'
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         walletAddress:
 *                           type: string
 *                           example: '0.0.12345'
 *                         displayName:
 *                           type: string
 *                         bio:
 *                           type: string
 *                         profilePictureUrl:
 *                           type: string
 *                         socialLinks:
 *                           type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getArtistById);

export default router;
