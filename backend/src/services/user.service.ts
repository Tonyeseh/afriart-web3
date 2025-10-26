import { supabase } from '../config/database';
import { logger } from '../config/logger';

export interface CreateUserInput {
  walletAddress: string;
  role: 'buyer' | 'artist' | 'admin';
  displayName?: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: Record<string, string>;
}

export interface UpdateUserInput {
  displayName?: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: Record<string, string>;
}

export interface User {
  id: string;
  walletAddress: string;
  role: string;
  displayName: string | null;
  email: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  socialLinks: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export class UserService {
  /**
   * Create a new user in the database
   */
  async createUser(input: CreateUserInput): Promise<User> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', input.walletAddress)
        .single();

      if (existingUser) {
        throw new Error('User with this wallet address already exists');
      }

      // Insert new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          wallet_address: input.walletAddress,
          role: input.role,
          display_name: input.displayName || null,
          email: input.email || null,
          bio: input.bio || null,
          profile_picture_url: input.profilePictureUrl || null,
          social_links: input.socialLinks || {},
        })
        .select()
        .single();

      if (error) {
        logger.error({ error, input }, 'Error creating user');
        throw new Error(`Failed to create user: ${error.message}`);
      }

      logger.info(
        { userId: data.id, walletAddress: input.walletAddress, role: input.role },
        'User created successfully'
      );

      return this.mapUserFromDb(data);
    } catch (error) {
      logger.error({ error, input }, 'Error in createUser');
      throw error;
    }
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        logger.error({ error, walletAddress }, 'Error fetching user by wallet');
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      return this.mapUserFromDb(data);
    } catch (error) {
      logger.error({ error, walletAddress }, 'Error in getUserByWallet');
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error({ error, userId }, 'Error fetching user by ID');
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      return this.mapUserFromDb(data);
    } catch (error) {
      logger.error({ error, userId }, 'Error in getUserById');
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(walletAddress: string, input: UpdateUserInput): Promise<User> {
    try {
      const updateData: any = {};

      if (input.displayName !== undefined) updateData.display_name = input.displayName;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.profilePictureUrl !== undefined)
        updateData.profile_picture_url = input.profilePictureUrl;
      if (input.socialLinks !== undefined) updateData.social_links = input.socialLinks;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) {
        logger.error({ error, walletAddress, input }, 'Error updating user');
        throw new Error(`Failed to update user: ${error.message}`);
      }

      logger.info({ userId: data.id, walletAddress }, 'User updated successfully');

      return this.mapUserFromDb(data);
    } catch (error) {
      logger.error({ error, walletAddress, input }, 'Error in updateUser');
      throw error;
    }
  }

  /**
   * Get all artists (verified only by default)
   */
  async getArtists(includeUnverified: boolean = false): Promise<User[]> {
    try {
      let query = supabase.from('users').select('*').eq('role', 'artist');

      if (!includeUnverified) {
        // Join with artists table to filter by verification status
        const { data, error } = await supabase
          .from('users')
          .select(
            `
            *,
            artists!inner(verification_status)
          `
          )
          .eq('role', 'artist')
          .eq('artists.verification_status', 'verified');

        if (error) {
          logger.error({ error }, 'Error fetching artists');
          throw new Error(`Failed to fetch artists: ${error.message}`);
        }

        return data.map((row) => this.mapUserFromDb(row));
      }

      const { data, error } = await query;

      if (error) {
        logger.error({ error }, 'Error fetching all artists');
        throw new Error(`Failed to fetch artists: ${error.message}`);
      }

      return data.map((row) => this.mapUserFromDb(row));
    } catch (error) {
      logger.error({ error }, 'Error in getArtists');
      throw error;
    }
  }

  /**
   * Check if user exists
   */
  async userExists(walletAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error({ error, walletAddress }, 'Error checking user existence');
        throw new Error(`Failed to check user existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      logger.error({ error, walletAddress }, 'Error in userExists');
      throw error;
    }
  }

  /**
   * Delete user (admin only - soft delete by updating status could be added)
   */
  async deleteUser(walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('wallet_address', walletAddress);

      if (error) {
        logger.error({ error, walletAddress }, 'Error deleting user');
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      logger.info({ walletAddress }, 'User deleted successfully');
    } catch (error) {
      logger.error({ error, walletAddress }, 'Error in deleteUser');
      throw error;
    }
  }

  /**
   * Get user statistics (NFTs owned, created, favorites, etc.)
   */
  async getUserStats(userId: string): Promise<Record<string, any>> {
    try {
      // Get NFTs owned
      const { count: nftsOwned } = await supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      // Get NFTs created
      const { count: nftsCreated } = await supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Get favorites count
      const { count: favoritesCount } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get sales made (as seller)
      const { count: salesMade } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);

      // Get purchases made (as buyer)
      const { count: purchasesMade } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', userId);

      // Get total earnings (as artist)
      const { data: earnings } = await supabase
        .from('sales')
        .select('artist_receives_hbar')
        .eq('seller_id', userId);

      const totalEarnings = earnings?.reduce(
        (sum, sale) => sum + parseFloat(sale.artist_receives_hbar || '0'),
        0
      ) || 0;

      return {
        nftsOwned: nftsOwned || 0,
        nftsCreated: nftsCreated || 0,
        favoritesCount: favoritesCount || 0,
        salesMade: salesMade || 0,
        purchasesMade: purchasesMade || 0,
        totalEarningsHbar: totalEarnings,
      };
    } catch (error) {
      logger.error({ error, userId }, 'Error getting user stats');
      throw error;
    }
  }

  /**
   * Map database row to User type
   */
  private mapUserFromDb(data: any): User {
    return {
      id: data.id,
      walletAddress: data.wallet_address,
      role: data.role,
      displayName: data.display_name,
      email: data.email,
      bio: data.bio,
      profilePictureUrl: data.profile_picture_url,
      socialLinks: data.social_links || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const userService = new UserService();
