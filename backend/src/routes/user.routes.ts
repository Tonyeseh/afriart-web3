import { Router } from 'express';
import {
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserStats,
} from '../controllers/user.controller';
import {
  authenticate,
  requireWalletOwnership,
  requireRole,
  optionalAuthenticate,
} from '../middleware/auth.middleware';

const router: Router = Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account after wallet verification. Called after successful signature verification when the user doesn't exist yet.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - role
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0\.0\.\d+$'
 *                 example: '0.0.12345'
 *               role:
 *                 type: string
 *                 enum: [buyer, artist, admin]
 *                 example: 'artist'
 *               displayName:
 *                 type: string
 *                 example: 'John Doe'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'john@example.com'
 *               bio:
 *                 type: string
 *                 example: 'Digital artist from Lagos'
 *               profilePictureUrl:
 *                 type: string
 *                 format: uri
 *                 example: 'https://ipfs.io/ipfs/Qm...'
 *               socialLinks:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   twitter: 'https://twitter.com/johndoe'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthToken'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', registerUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of users filtered by role. Currently supports artists only.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [artist]
 *           example: 'artist'
 *         description: Filter users by role
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     count:
 *                       type: integer
 *                       example: 25
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', getUsers);

/**
 * @swagger
 * /api/users/{walletAddress}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve a user's profile by wallet address, including statistics
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0\.0\.\d+$'
 *           example: '0.0.12345'
 *         description: Hedera wallet address
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
 *                     stats:
 *                       $ref: '#/components/schemas/UserStats'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:walletAddress', optionalAuthenticate, getUserProfile);

/**
 * @swagger
 * /api/users/{walletAddress}:
 *   patch:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile. Users can only update their own profile (except admins).
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0\.0\.\d+$'
 *           example: '0.0.12345'
 *         description: Hedera wallet address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: 'John Doe Updated'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'newemail@example.com'
 *               bio:
 *                 type: string
 *                 example: 'Updated bio'
 *               profilePictureUrl:
 *                 type: string
 *                 format: uri
 *                 example: 'https://ipfs.io/ipfs/Qm...'
 *               socialLinks:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:walletAddress', authenticate, requireWalletOwnership, updateUserProfile);

/**
 * @swagger
 * /api/users/{walletAddress}:
 *   delete:
 *     summary: Delete user account
 *     description: Delete a user account. Users can only delete their own account (except admins).
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0\.0\.\d+$'
 *           example: '0.0.12345'
 *         description: Hedera wallet address
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: 'User deleted successfully'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:walletAddress',
  authenticate,
  requireWalletOwnership,
  deleteUser
);

/**
 * @swagger
 * /api/users/{walletAddress}/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve statistics for a user including NFTs owned, created, sales, and earnings
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0\.0\.\d+$'
 *           example: '0.0.12345'
 *         description: Hedera wallet address
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     stats:
 *                       $ref: '#/components/schemas/UserStats'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:walletAddress/stats', getUserStats);

export default router;
