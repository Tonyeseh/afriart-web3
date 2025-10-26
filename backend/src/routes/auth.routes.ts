import { Router } from 'express';
import {
  getAuthMessage,
  verifyAndAuthenticate,
  logout,
  getCurrentUser,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: Router = Router();

/**
 * @swagger
 * /api/auth/message:
 *   get:
 *     summary: Get authentication message to sign
 *     description: Generates a timestamped message for the user to sign with their Hedera wallet. This message is valid for 5 minutes.
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0\.0\.\d+$'
 *           example: '0.0.12345'
 *         description: Hedera wallet address in format 0.0.xxxxx
 *     responses:
 *       200:
 *         description: Authentication message generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthMessage'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/message', getAuthMessage);

/**
 * POST /api/auth/connect - Alias for /api/auth/message (MVP plan compatibility)
 * Initiate wallet connection by getting a message to sign
 */
router.post('/connect', getAuthMessage);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify wallet signature and authenticate
 *     description: Verifies the signed message and returns a JWT token if the user exists, or indicates registration is needed for new users.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - message
 *               - signature
 *               - publicKey
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0\.0\.\d+$'
 *                 example: '0.0.12345'
 *                 description: Hedera wallet address
 *               message:
 *                 type: string
 *                 example: 'AfriArt Authentication\n\nWallet: 0.0.12345...'
 *                 description: The message that was signed
 *               signature:
 *                 type: string
 *                 example: 'abc123def456...'
 *                 description: Hex-encoded signature from wallet
 *               publicKey:
 *                 type: string
 *                 example: '302a300506032b6570032100...'
 *                 description: Public key of the wallet
 *     responses:
 *       200:
 *         description: Authentication successful or registration needed
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     needsRegistration:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         walletAddress:
 *                           type: string
 *                           example: '0.0.12345'
 *                         publicKey:
 *                           type: string
 *                           example: '302a300506032b6570032100...'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     needsRegistration:
 *                       type: boolean
 *                       example: false
 *                     data:
 *                       $ref: '#/components/schemas/AuthToken'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid signature or expired message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify', verifyAndAuthenticate);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the current user. Note that with JWT tokens, logout is primarily client-side (removing the token). This endpoint logs the event for audit purposes.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: 'Logged out successfully'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', authenticate, logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Returns the profile of the currently authenticated user with fresh data from the database.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
