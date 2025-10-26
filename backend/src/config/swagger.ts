import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AfriArt NFT Marketplace API',
      version: '1.0.0',
      description: `
        AfriArt is a Web3 NFT marketplace connecting African artists with the global market.
        Built on Hedera Hashgraph with IPFS storage and Supabase backend.

        ## Features
        - Wallet-based authentication (Hedera)
        - NFT minting and trading
        - Artist verification system
        - Direct sales and auctions
        - IPFS-backed storage

        ## Authentication
        Most endpoints require a JWT token obtained through wallet signature verification.
        Include the token in the Authorization header: \`Bearer <token>\`

        ## Base URL
        - Development: http://localhost:4000
        - Production: TBD
      `,
      contact: {
        name: 'AfriArt Support',
        email: 'support@afriart.io',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.afriart.io',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/auth/verify',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            walletAddress: {
              type: 'string',
              pattern: '^0\\.0\\.\\d+$',
              example: '0.0.12345',
              description: 'Hedera wallet address',
            },
            role: {
              type: 'string',
              enum: ['buyer', 'artist', 'admin'],
              example: 'artist',
            },
            displayName: {
              type: 'string',
              nullable: true,
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
              example: 'john@example.com',
            },
            bio: {
              type: 'string',
              nullable: true,
              example: 'Digital artist from Lagos',
            },
            profilePictureUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              example: 'https://ipfs.io/ipfs/Qm...',
            },
            socialLinks: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              example: {
                twitter: 'https://twitter.com/johndoe',
                instagram: 'https://instagram.com/johndoe',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-25T10:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-25T10:00:00.000Z',
            },
          },
        },
        UserStats: {
          type: 'object',
          properties: {
            nftsOwned: {
              type: 'integer',
              example: 5,
            },
            nftsCreated: {
              type: 'integer',
              example: 12,
            },
            favoritesCount: {
              type: 'integer',
              example: 8,
            },
            salesMade: {
              type: 'integer',
              example: 10,
            },
            purchasesMade: {
              type: 'integer',
              example: 3,
            },
            totalEarningsHbar: {
              type: 'number',
              format: 'float',
              example: 1250.50,
            },
          },
        },
        AuthMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'AfriArt Authentication\\n\\nWallet: 0.0.12345\\nTimestamp: 1730000000000\\n\\nSign this message...',
            },
            expiresInMinutes: {
              type: 'integer',
              example: 5,
            },
          },
        },
        AuthToken: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        Artist: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '223e4567-e89b-12d3-a456-426614174000',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Reference to the user who is the artist',
            },
            verificationStatus: {
              type: 'string',
              enum: ['pending', 'verified', 'rejected'],
              example: 'verified',
              description: 'Current verification status of the artist',
            },
            kycDocuments: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
              example: ['ipfs://QmXyZ123...', 'ipfs://QmAbc456...'],
              description: 'IPFS URLs for KYC documents (only visible to artist and admin)',
            },
            portfolioUrls: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
              example: ['ipfs://QmDef789...', 'ipfs://QmGhi012...'],
              description: 'IPFS URLs for portfolio artwork samples',
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-10-25T10:00:00.000Z',
              description: 'When the verification was submitted',
            },
            verifiedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-10-26T14:30:00.000Z',
              description: 'When the verification was approved',
            },
            rejectionReason: {
              type: 'string',
              nullable: true,
              example: 'Insufficient portfolio samples',
              description: 'Reason for rejection (if status is rejected)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-25T10:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-26T14:30:00.000Z',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'No authentication token provided',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'User does not have permission to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Access denied. Required role: admin',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'User not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Invalid Hedera wallet address format',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Wallet-based authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management and profile endpoints',
      },
      {
        name: 'Artists',
        description: 'Artist verification and portfolio management',
      },
      {
        name: 'NFTs',
        description: 'NFT minting, listing, and marketplace operations',
      },
      {
        name: 'Upload',
        description: 'File upload to IPFS',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (admin role required)',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
