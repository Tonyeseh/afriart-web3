import { Request, Response } from 'express';
import { ipfsService } from '../services/ipfs.service';
import { logger } from '../config/logger';

/**
 * Upload file to IPFS
 * POST /api/upload/file
 */
export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file provided',
      });
      return;
    }

    const file = req.file;

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      res.status(400).json({
        success: false,
        error: 'File size exceeds maximum allowed size of 50MB',
      });
      return;
    }

    // Validate file type (images, videos, audio)
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      // Documents (for KYC)
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        error: `File type ${file.mimetype} is not allowed`,
      });
      return;
    }

    logger.info(`Uploading file to IPFS: ${file.originalname} (${file.size} bytes)`);

    // Upload to IPFS
    const result = await ipfsService.uploadFile(file.buffer, {
      name: file.originalname,
    });

    logger.info(`File uploaded to IPFS: ${result.cid}`);

    res.status(200).json({
      success: true,
      data: {
        cid: result.cid,
        url: result.url,
        ipfsUrl: `ipfs://${result.cid}`,
        size: result.size,
        filename: file.originalname,
        mimetype: file.mimetype,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'File upload to IPFS failed');
    res.status(500).json({
      success: false,
      error: 'Failed to upload file to IPFS',
    });
  }
}

/**
 * Upload multiple files to IPFS
 * POST /api/upload/files
 */
export async function uploadFiles(req: Request, res: Response): Promise<void> {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files provided',
      });
      return;
    }

    const files = req.files as Express.Multer.File[];

    // Validate max 10 files
    if (files.length > 10) {
      res.status(400).json({
        success: false,
        error: 'Maximum 10 files allowed per upload',
      });
      return;
    }

    // Validate file size (max 50MB each)
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = files.filter((f) => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      res.status(400).json({
        success: false,
        error: `${oversizedFiles.length} file(s) exceed maximum allowed size of 50MB`,
      });
      return;
    }

    logger.info(`Uploading ${files.length} files to IPFS`);

    // Upload all files in parallel
    const uploadPromises = files.map((file) =>
      ipfsService.uploadFile(file.buffer, {
        name: file.originalname,
      })
    );

    const results = await Promise.all(uploadPromises);

    logger.info(`Successfully uploaded ${results.length} files to IPFS`);

    res.status(200).json({
      success: true,
      data: {
        files: results.map((result, index) => ({
          cid: result.cid,
          url: result.url,
          ipfsUrl: `ipfs://${result.cid}`,
          size: result.size,
          filename: files[index].originalname,
          mimetype: files[index].mimetype,
        })),
        count: results.length,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Multiple file upload to IPFS failed');
    res.status(500).json({
      success: false,
      error: 'Failed to upload files to IPFS',
    });
  }
}

/**
 * Upload JSON metadata to IPFS
 * POST /api/upload/metadata
 */
export async function uploadMetadata(req: Request, res: Response): Promise<void> {
  try {
    const { metadata, name } = req.body;

    if (!metadata) {
      res.status(400).json({
        success: false,
        error: 'Metadata object is required',
      });
      return;
    }

    if (!name || typeof name !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Name is required and must be a string',
      });
      return;
    }

    // Validate metadata is an object
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      res.status(400).json({
        success: false,
        error: 'Metadata must be a valid object',
      });
      return;
    }

    logger.info(`Uploading metadata to IPFS: ${name}`);

    // Upload to IPFS
    const result = await ipfsService.uploadJSON(metadata, { name });

    logger.info(`Metadata uploaded to IPFS: ${result.cid}`);

    res.status(200).json({
      success: true,
      data: {
        cid: result.cid,
        url: result.url,
        ipfsUrl: `ipfs://${result.cid}`,
        name,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Metadata upload to IPFS failed');
    res.status(500).json({
      success: false,
      error: 'Failed to upload metadata to IPFS',
    });
  }
}

/**
 * Test file retrieval from IPFS
 * GET /api/upload/test/:cid
 */
export async function testRetrieval(req: Request, res: Response): Promise<void> {
  try {
    const { cid } = req.params;

    if (!cid) {
      res.status(400).json({
        success: false,
        error: 'CID is required',
      });
      return;
    }

    // Validate CID format (basic check)
    if (!cid.startsWith('Qm') && !cid.startsWith('bafy')) {
      res.status(400).json({
        success: false,
        error: 'Invalid CID format',
      });
      return;
    }

    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    logger.info(`Testing IPFS retrieval for CID: ${cid}`);

    // Try to fetch the file from IPFS
    const axios = require('axios');
    const response = await axios.get(gatewayUrl, {
      timeout: 10000, // 10 second timeout
      validateStatus: (status: number) => status < 500, // Don't throw on 404
    });

    if (response.status === 404) {
      res.status(404).json({
        success: false,
        error: 'File not found on IPFS',
        cid,
      });
      return;
    }

    if (response.status !== 200) {
      res.status(response.status).json({
        success: false,
        error: 'Failed to retrieve file from IPFS',
        cid,
      });
      return;
    }

    logger.info(`Successfully retrieved file from IPFS: ${cid}`);

    res.status(200).json({
      success: true,
      data: {
        cid,
        url: gatewayUrl,
        ipfsUrl: `ipfs://${cid}`,
        accessible: true,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'IPFS retrieval test failed');
    res.status(500).json({
      success: false,
      error: 'Failed to test IPFS retrieval',
    });
  }
}
