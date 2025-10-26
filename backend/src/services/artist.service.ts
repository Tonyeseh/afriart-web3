import { supabase } from '../config/database';
import { logger } from '../config/logger';

export interface SubmitVerificationInput {
  userId: string;
  kycDocuments: string[];  // Array of IPFS URLs
  portfolioUrls: string[];  // Array of image URLs
}

export interface Artist {
  id: string;
  userId: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments: string[];
  portfolioUrls: string[];
  rejectionReason: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export class ArtistService {
  /**
   * Submit artist verification request
   */
  async submitVerification(input: SubmitVerificationInput): Promise<Artist> {
    try {
      // Check if artist record already exists
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', input.userId)
        .single();

      if (existingArtist) {
        // Update existing record
        const { data, error } = await supabase
          .from('artists')
          .update({
            kyc_documents: input.kycDocuments,
            portfolio_urls: input.portfolioUrls,
            verification_status: 'pending',
            submitted_at: new Date().toISOString(),
            rejection_reason: null,  // Clear previous rejection
          })
          .eq('user_id', input.userId)
          .select()
          .single();

        if (error) {
          logger.error({ error, userId: input.userId }, 'Error updating artist verification');
          throw new Error(`Failed to update verification: ${error.message}`);
        }

        logger.info({ artistId: data.id, userId: input.userId }, 'Artist verification resubmitted');
        return this.mapArtistFromDb(data);
      } else {
        // Create new artist record
        const { data, error } = await supabase
          .from('artists')
          .insert({
            user_id: input.userId,
            kyc_documents: input.kycDocuments,
            portfolio_urls: input.portfolioUrls,
            verification_status: 'pending',
            submitted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          logger.error({ error, userId: input.userId }, 'Error creating artist verification');
          throw new Error(`Failed to submit verification: ${error.message}`);
        }

        logger.info({ artistId: data.id, userId: input.userId }, 'Artist verification submitted');
        return this.mapArtistFromDb(data);
      }
    } catch (error) {
      logger.error({ error, userId: input.userId }, 'Error in submitVerification');
      throw error;
    }
  }

  /**
   * Get artist by ID
   */
  async getArtistById(artistId: string): Promise<Artist | null> {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error({ error, artistId }, 'Error fetching artist by ID');
        throw new Error(`Failed to fetch artist: ${error.message}`);
      }

      return this.mapArtistFromDb(data);
    } catch (error) {
      logger.error({ error, artistId }, 'Error in getArtistById');
      throw error;
    }
  }

  /**
   * Get artist by user ID
   */
  async getArtistByUserId(userId: string): Promise<Artist | null> {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error({ error, userId }, 'Error fetching artist by user ID');
        throw new Error(`Failed to fetch artist: ${error.message}`);
      }

      return this.mapArtistFromDb(data);
    } catch (error) {
      logger.error({ error, userId }, 'Error in getArtistByUserId');
      throw error;
    }
  }

  /**
   * Get all verified artists
   */
  async getVerifiedArtists(): Promise<Artist[]> {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('verification_status', 'verified')
        .order('verified_at', { ascending: false });

      if (error) {
        logger.error({ error }, 'Error fetching verified artists');
        throw new Error(`Failed to fetch artists: ${error.message}`);
      }

      return data.map((row) => this.mapArtistFromDb(row));
    } catch (error) {
      logger.error({ error }, 'Error in getVerifiedArtists');
      throw error;
    }
  }

  /**
   * Get pending verifications (admin only)
   */
  async getPendingVerifications(): Promise<Artist[]> {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('verification_status', 'pending')
        .order('submitted_at', { ascending: true });

      if (error) {
        logger.error({ error }, 'Error fetching pending verifications');
        throw new Error(`Failed to fetch pending verifications: ${error.message}`);
      }

      return data.map((row) => this.mapArtistFromDb(row));
    } catch (error) {
      logger.error({ error }, 'Error in getPendingVerifications');
      throw error;
    }
  }

  /**
   * Approve artist verification (admin only)
   */
  async approveArtist(artistId: string): Promise<Artist> {
    try {
      const { data, error } = await supabase
        .from('artists')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', artistId)
        .select()
        .single();

      if (error) {
        logger.error({ error, artistId }, 'Error approving artist');
        throw new Error(`Failed to approve artist: ${error.message}`);
      }

      logger.info({ artistId }, 'Artist approved');
      return this.mapArtistFromDb(data);
    } catch (error) {
      logger.error({ error, artistId }, 'Error in approveArtist');
      throw error;
    }
  }

  /**
   * Reject artist verification (admin only)
   */
  async rejectArtist(artistId: string, reason: string): Promise<Artist> {
    try {
      const { data, error } = await supabase
        .from('artists')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', artistId)
        .select()
        .single();

      if (error) {
        logger.error({ error, artistId }, 'Error rejecting artist');
        throw new Error(`Failed to reject artist: ${error.message}`);
      }

      logger.info({ artistId, reason }, 'Artist rejected');
      return this.mapArtistFromDb(data);
    } catch (error) {
      logger.error({ error, artistId }, 'Error in rejectArtist');
      throw error;
    }
  }

  /**
   * Map database row to Artist type
   */
  private mapArtistFromDb(data: any): Artist {
    return {
      id: data.id,
      userId: data.user_id,
      verificationStatus: data.verification_status,
      kycDocuments: data.kyc_documents || [],
      portfolioUrls: data.portfolio_urls || [],
      rejectionReason: data.rejection_reason,
      submittedAt: data.submitted_at,
      verifiedAt: data.verified_at,
      createdAt: data.created_at,
    };
  }
}

export const artistService = new ArtistService();
