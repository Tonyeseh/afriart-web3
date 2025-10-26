import { Router } from 'express';
import multer from 'multer';
import {
  uploadFile,
  uploadFiles,
  uploadMetadata,
  testRetrieval,
} from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: Router = Router();

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files
  },
});

/**
 * @swagger
 * /api/upload/file:
 *   post:
 *     summary: Upload a single file to IPFS
 *     description: Upload an image, video, audio, or PDF file to IPFS via Pinata. Returns IPFS CID and gateway URL.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 50MB). Allowed types - images (JPEG, PNG, GIF, WebP, SVG), videos (MP4, WebM, OGG), audio (MP3, WAV, OGG), documents (PDF)
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 *                     cid:
 *                       type: string
 *                       example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                       description: IPFS Content Identifier
 *                     url:
 *                       type: string
 *                       example: https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                       description: HTTP gateway URL
 *                     ipfsUrl:
 *                       type: string
 *                       example: ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                       description: IPFS protocol URL
 *                     size:
 *                       type: number
 *                       example: 1024567
 *                       description: File size in bytes
 *                     filename:
 *                       type: string
 *                       example: artwork.jpg
 *                     mimetype:
 *                       type: string
 *                       example: image/jpeg
 *       400:
 *         description: Bad request - no file provided, file too large, or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noFile:
 *                 value:
 *                   success: false
 *                   error: No file provided
 *               fileTooLarge:
 *                 value:
 *                   success: false
 *                   error: File size exceeds maximum allowed size of 50MB
 *               invalidType:
 *                 value:
 *                   success: false
 *                   error: File type application/zip is not allowed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to upload file to IPFS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/file', authenticate, upload.single('file'), uploadFile);

/**
 * @swagger
 * /api/upload/files:
 *   post:
 *     summary: Upload multiple files to IPFS
 *     description: Upload up to 10 files to IPFS in a single request. All files are uploaded in parallel.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple files to upload (max 10 files, 50MB each)
 *     responses:
 *       200:
 *         description: Files uploaded successfully
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
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cid:
 *                             type: string
 *                             example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                           url:
 *                             type: string
 *                             example: https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                           ipfsUrl:
 *                             type: string
 *                             example: ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                           size:
 *                             type: number
 *                             example: 1024567
 *                           filename:
 *                             type: string
 *                             example: artwork1.jpg
 *                           mimetype:
 *                             type: string
 *                             example: image/jpeg
 *                     count:
 *                       type: number
 *                       example: 3
 *       400:
 *         description: Bad request - no files, too many files, or files too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to upload files to IPFS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/files', authenticate, upload.array('files', 10), uploadFiles);

/**
 * @swagger
 * /api/upload/metadata:
 *   post:
 *     summary: Upload JSON metadata to IPFS
 *     description: Upload NFT metadata or any JSON object to IPFS. Useful for storing NFT metadata following HIP-412 standard.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: nft-metadata-sunset-in-lagos
 *                 description: Name for the metadata (used in Pinata)
 *               metadata:
 *                 type: object
 *                 description: JSON metadata object
 *                 example:
 *                   name: Sunset in Lagos
 *                   description: A beautiful digital painting of Lagos sunset
 *                   image: ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                   creator: Kwame Mensah
 *                   properties:
 *                     category: Digital Art
 *                     medium: Digital Painting
 *     responses:
 *       200:
 *         description: Metadata uploaded successfully
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
 *                     cid:
 *                       type: string
 *                       example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                       description: IPFS Content Identifier for the metadata
 *                     url:
 *                       type: string
 *                       example: https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                     ipfsUrl:
 *                       type: string
 *                       example: ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                     name:
 *                       type: string
 *                       example: nft-metadata-sunset-in-lagos
 *       400:
 *         description: Bad request - missing metadata or name, or invalid metadata format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to upload metadata to IPFS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/metadata', authenticate, uploadMetadata);

/**
 * @swagger
 * /api/upload/test/{cid}:
 *   get:
 *     summary: Test file retrieval from IPFS
 *     description: Verify that a file with the given CID is accessible on IPFS via Pinata gateway. Returns file metadata without downloading the file.
 *     tags: [Upload]
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *         description: IPFS Content Identifier (CID) starting with 'Qm' or 'bafy'
 *         example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *     responses:
 *       200:
 *         description: File is accessible on IPFS
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
 *                     cid:
 *                       type: string
 *                       example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                     url:
 *                       type: string
 *                       example: https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                     ipfsUrl:
 *                       type: string
 *                       example: ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *                     accessible:
 *                       type: boolean
 *                       example: true
 *                     contentType:
 *                       type: string
 *                       example: image/jpeg
 *                     contentLength:
 *                       type: string
 *                       example: "1024567"
 *       400:
 *         description: Invalid CID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: File not found on IPFS
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: File not found on IPFS
 *                 cid:
 *                   type: string
 *                   example: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
 *       500:
 *         description: Failed to test IPFS retrieval
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/test/:cid', testRetrieval);

export default router;
