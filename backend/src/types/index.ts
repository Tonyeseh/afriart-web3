import { Request } from 'express';

/**
 * User roles in the system
 */
export type UserRole = 'buyer' | 'artist' | 'admin';

/**
 * Artist verification status
 */
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

/**
 * Authenticated user data attached to requests
 */
export interface AuthenticatedUser {
  userId: string;
  walletAddress: string;
  role: UserRole;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * API Response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * User social links
 */
export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  website?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

/**
 * Database user entity
 */
export interface DbUser {
  id: string;
  wallet_address: string;
  role: UserRole;
  display_name: string | null;
  email: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  social_links: SocialLinks;
  created_at: string;
  updated_at: string;
}

/**
 * Database artist entity
 */
export interface DbArtist {
  id: string;
  user_id: string;
  verification_status: VerificationStatus;
  kyc_documents: string[];
  portfolio_urls: string[];
  rejection_reason: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  created_at: string;
}

/**
 * Database NFT entity
 */
export interface DbNft {
  id: string;
  token_id: string;
  serial_number: number | null;
  creator_id: string;
  owner_id: string;
  title: string;
  description: string | null;
  art_technique: string | null;
  art_material: string | null;
  image_url: string;
  image_ipfs_cid: string | null;
  metadata_url: string | null;
  metadata_ipfs_cid: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  price_hbar: string | null;
  price_usd: string | null;
  is_listed: boolean;
  view_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
  minted_at: string | null;
}

/**
 * Database sale entity
 */
export interface DbSale {
  id: string;
  nft_id: string;
  seller_id: string;
  buyer_id: string;
  sale_price_hbar: string;
  sale_price_usd: string | null;
  platform_fee_hbar: string | null;
  artist_receives_hbar: string | null;
  transaction_id: string | null;
  created_at: string;
}

/**
 * HIP-412 NFT Metadata structure
 */
export interface HIP412Metadata {
  name: string;
  creator: string;
  creatorDID?: string;
  description?: string;
  image: string;
  type: string;
  format?: string;
  properties?: {
    technique?: string;
    material?: string;
    dimensions?: string;
    yearCreated?: string;
    country?: string;
    [key: string]: any;
  };
  files?: Array<{
    uri: string;
    type: string;
    metadata?: any;
  }>;
  localization?: {
    uri: string;
    default: string;
    locales: string[];
  };
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

/**
 * IPFS upload result
 */
export interface IpfsUploadResult {
  cid: string;
  url: string;
  size: number;
}

/**
 * Hedera transaction result
 */
export interface HederaTransactionResult {
  transactionId: string;
  status: string;
  tokenId?: string;
  serialNumber?: number;
}

/**
 * Error with status code
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  maxImageSizeMB: number;
  maxVideoSizeMB: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
}

/**
 * Platform settings
 */
export interface PlatformSettings {
  platformFeePercent: number;
  nftCollectionTokenId: string;
  treasuryAccountId: string;
  maxImageSizeMB: number;
  maxVideoSizeMB: number;
}
