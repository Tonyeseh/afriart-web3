import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { mintNFT, uploadMiddleware, listNFTs, getNFT, toggleListing, updatePrice } from '../controllers/nft.controller';
import { purchaseNFT } from '../controllers/purchase.controller';

const router: Router = Router();

/**
 * @swagger
 * /api/nfts/mint:
 *   post:
 *     summary: Mint a new NFT
 *     description: |
 *       Complete NFT minting workflow:
 *       1. Upload artwork image to IPFS
 *       2. Generate HIP-412 compliant metadata
 *       3. Upload metadata to IPFS
 *       4. Mint NFT on Hedera blockchain
 *       5. Save NFT details to database
 *
 *       Only verified artists can mint NFTs.
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *                 description: NFT title/name
 *                 example: Sunset in Lagos
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 description: Detailed description of the artwork
 *                 example: A beautiful digital painting capturing the vibrant sunset over Lagos city
 *                 minLength: 10
 *                 maxLength: 1000
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Artwork image file (PNG or JPEG, max 50MB)
 *               technique:
 *                 type: string
 *                 description: Art technique used (optional)
 *                 example: Digital Painting
 *               material:
 *                 type: string
 *                 description: Materials used (optional)
 *                 example: Digital
 *               yearCreated:
 *                 type: string
 *                 description: Year the artwork was created (optional)
 *                 example: "2024"
 *               dimensions:
 *                 type: string
 *                 description: Artwork dimensions (optional)
 *                 example: 1920x1080px
 *               country:
 *                 type: string
 *                 description: Country of origin (optional)
 *                 example: Nigeria
 *     responses:
 *       201:
 *         description: NFT minted successfully
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
 *                     nft:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         token_id:
 *                           type: string
 *                           example: "0.0.12345.1"
 *                           description: Hedera token ID with serial number
 *                         serial_number:
 *                           type: number
 *                           example: 1
 *                         creator_id:
 *                           type: string
 *                           format: uuid
 *                         owner_id:
 *                           type: string
 *                           format: uuid
 *                         title:
 *                           type: string
 *                           example: Sunset in Lagos
 *                         description:
 *                           type: string
 *                         image_url:
 *                           type: string
 *                           example: https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                         image_ipfs_cid:
 *                           type: string
 *                           example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                         metadata_url:
 *                           type: string
 *                           example: https://gateway.pinata.cloud/ipfs/QmMetadata123...
 *                         metadata_ipfs_cid:
 *                           type: string
 *                           example: QmMetadata123...
 *                         art_technique:
 *                           type: string
 *                         art_material:
 *                           type: string
 *                         file_type:
 *                           type: string
 *                           example: image/png
 *                         is_listed:
 *                           type: boolean
 *                           example: false
 *                         minted_at:
 *                           type: string
 *                           format: date-time
 *                     transaction:
 *                       type: object
 *                       properties:
 *                         tokenId:
 *                           type: string
 *                           example: "0.0.12345"
 *                         serialNumber:
 *                           type: number
 *                           example: 1
 *                         transactionId:
 *                           type: string
 *                           example: "0.0.12345@1234567890.123456789"
 *                           description: Hedera transaction ID
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 value:
 *                   success: false
 *                   error: Title and description are required
 *               missingImage:
 *                 value:
 *                   success: false
 *                   error: Image file is required
 *               invalidFileType:
 *                 value:
 *                   success: false
 *                   error: Invalid file type. Only PNG and JPEG allowed.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only artists can mint NFTs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: Only verified artists can mint NFTs
 *       500:
 *         description: Minting failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               ipfsError:
 *                 value:
 *                   success: false
 *                   error: Failed to upload to IPFS
 *               hederaError:
 *                 value:
 *                   success: false
 *                   error: Failed to mint on Hedera
 *               databaseError:
 *                 value:
 *                   success: false
 *                   error: Failed to save NFT to database
 */
router.post(
  '/mint',
  authenticate,
  requireRole('artist'),
  uploadMiddleware,
  mintNFT
);

/**
 * @swagger
 * /api/nfts:
 *   get:
 *     summary: List all NFTs with filters and pagination
 *     description: Get a paginated list of NFTs with optional filters for technique, material, price range, and search
 *     tags: [NFTs]
 *     parameters:
 *       - in: query
 *         name: technique
 *         schema:
 *           type: string
 *         description: Filter by art technique
 *         example: Digital Art
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *         description: Filter by art material
 *         example: Digital
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *         description: Minimum price in HBAR
 *         example: 10
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *         description: Maximum price in HBAR
 *         example: 1000
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *         example: Lagos
 *       - in: query
 *         name: isListed
 *         schema:
 *           type: boolean
 *         description: Filter by listing status
 *         example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, price_hbar, title, minted_at]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: NFTs retrieved successfully
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
 *                     nfts:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 150
 *                         totalPages:
 *                           type: integer
 *                           example: 8
 */
router.get('/', listNFTs);

/**
 * @swagger
 * /api/nfts/{id}:
 *   get:
 *     summary: Get a single NFT by ID
 *     description: Retrieve detailed information about a specific NFT including creator and owner details
 *     tags: [NFTs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: NFT ID
 *     responses:
 *       200:
 *         description: NFT retrieved successfully
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
 *                     nft:
 *                       type: object
 *       404:
 *         description: NFT not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getNFT);

/**
 * @swagger
 * /api/nfts/{id}/list:
 *   patch:
 *     summary: List or unlist NFT for sale
 *     description: Toggle NFT listing status. Only the owner can list/unlist their NFT.
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: NFT ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isListed
 *             properties:
 *               isListed:
 *                 type: boolean
 *                 description: Whether to list or unlist the NFT
 *                 example: true
 *               price:
 *                 type: number
 *                 description: Price in HBAR (required when listing)
 *                 example: 100
 *                 minimum: 0
 *                 maximum: 1000000
 *     responses:
 *       200:
 *         description: Listing status updated successfully
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
 *                     nft:
 *                       type: object
 *                 message:
 *                   type: string
 *                   example: NFT listed for sale
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only owner can list/unlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: NFT not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/list', authenticate, toggleListing);

/**
 * @swagger
 * /api/nfts/{id}/price:
 *   patch:
 *     summary: Update NFT price
 *     description: Update the price of a listed NFT. Only the owner can update the price.
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: NFT ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price
 *             properties:
 *               price:
 *                 type: number
 *                 description: New price in HBAR
 *                 example: 150
 *                 minimum: 0
 *                 maximum: 1000000
 *     responses:
 *       200:
 *         description: Price updated successfully
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
 *                     nft:
 *                       type: object
 *                 message:
 *                   type: string
 *                   example: Price updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only owner can update price
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: NFT not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/price', authenticate, updatePrice);

/**
 * @swagger
 * /api/nfts/{id}/purchase:
 *   post:
 *     summary: Purchase an NFT
 *     description: |
 *       Complete NFT purchase workflow:
 *       1. Validate NFT is listed and price matches
 *       2. Execute atomic Hedera transaction (HBAR + NFT transfer)
 *       3. Verify transaction on Mirror Node
 *       4. Update NFT ownership in database
 *       5. Create sale record
 *
 *       The transaction transfers:
 *       - 98% of price to seller
 *       - 2% platform fee to treasury
 *       - NFT ownership to buyer
 *
 *       All transfers happen atomically (all succeed or all fail).
 *     tags: [NFTs, Purchases]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: NFT ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expectedPrice
 *             properties:
 *               expectedPrice:
 *                 type: number
 *                 description: Expected price in HBAR (must match current listing price)
 *                 example: 100
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: NFT purchased successfully
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
 *                   example: NFT purchased successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sale:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         nft_id:
 *                           type: string
 *                           format: uuid
 *                         seller_id:
 *                           type: string
 *                           format: uuid
 *                         buyer_id:
 *                           type: string
 *                           format: uuid
 *                         sale_price_hbar:
 *                           type: string
 *                           example: "100.00"
 *                         platform_fee_hbar:
 *                           type: string
 *                           example: "2.00"
 *                         artist_receives_hbar:
 *                           type: string
 *                           example: "98.00"
 *                         transaction_id:
 *                           type: string
 *                           example: "0.0.123456@1234567890.123456789"
 *                         status:
 *                           type: string
 *                           example: completed
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                     transactionId:
 *                       type: string
 *                       example: "0.0.123456@1234567890.123456789"
 *       400:
 *         description: Invalid request or NFT not available for purchase
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notListed:
 *                 summary: NFT not listed
 *                 value:
 *                   success: false
 *                   error: NFT is not listed for sale
 *               priceChanged:
 *                 summary: Price changed
 *                 value:
 *                   success: false
 *                   error: "Price has changed. Current price: 150 HBAR"
 *               ownNFT:
 *                 summary: Cannot buy own NFT
 *                 value:
 *                   success: false
 *                   error: Cannot purchase your own NFT
 *               insufficientBalance:
 *                 summary: Insufficient balance
 *                 value:
 *                   success: false
 *                   error: Insufficient HBAR balance
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: NFT not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Purchase already in progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Transaction failed on blockchain
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/purchase', authenticate, purchaseNFT);

export default router;