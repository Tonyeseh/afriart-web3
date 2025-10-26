import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { logger } from '../config/logger';

/**
 * GET /api/admin/pending-verifications
 * Get all pending artist verification requests
 */
export async function getPendingVerifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data: artists, error } = await supabase
      .from('artists')
      .select(
        `
        id,
        user_id,
        verification_status,
        kyc_documents,
        portfolio_urls,
        submitted_at,
        created_at,
        user:users!user_id(
          id,
          wallet_address,
          display_name,
          email,
          bio,
          profile_picture_url,
          social_links
        )
      `
      )
      .eq('verification_status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      data: {
        artists: artists || [],
        count: artists?.length || 0,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching pending verifications');
    next(error);
  }
}

/**
 * PATCH /api/admin/artists/:id/approve
 * Approve an artist verification request
 */
export async function approveArtist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Check if artist exists and is pending
    const { data: artist, error: fetchError } = await supabase
      .from('artists')
      .select('id, user_id, verification_status')
      .eq('id', id)
      .single();

    if (fetchError || !artist) {
      res.status(404).json({
        success: false,
        error: 'Artist verification request not found',
      });
      return;
    }

    if (artist.verification_status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `Artist is already ${artist.verification_status}`,
      });
      return;
    }

    // Approve artist
    const { data: updatedArtist, error: updateError } = await supabase
      .from('artists')
      .update({
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to approve artist: ${updateError.message}`);
    }

    // Update user role to 'artist'
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ role: 'artist' })
      .eq('id', artist.user_id);

    if (userUpdateError) {
      logger.error(
        { error: userUpdateError, userId: artist.user_id },
        'Failed to update user role'
      );
      // Continue - artist is approved even if role update fails
    }

    logger.info({ artistId: id, userId: artist.user_id }, 'Artist approved');

    res.status(200).json({
      success: true,
      message: 'Artist verification approved',
      data: { artist: updatedArtist },
    });
  } catch (error) {
    logger.error({ error, artistId: req.params.id }, 'Error approving artist');
    next(error);
  }
}

/**
 * PATCH /api/admin/artists/:id/reject
 * Reject an artist verification request
 */
export async function rejectArtist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required (minimum 10 characters)',
      });
      return;
    }

    // Check if artist exists and is pending
    const { data: artist, error: fetchError } = await supabase
      .from('artists')
      .select('id, user_id, verification_status')
      .eq('id', id)
      .single();

    if (fetchError || !artist) {
      res.status(404).json({
        success: false,
        error: 'Artist verification request not found',
      });
      return;
    }

    if (artist.verification_status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `Artist is already ${artist.verification_status}`,
      });
      return;
    }

    // Reject artist
    const { data: updatedArtist, error: updateError } = await supabase
      .from('artists')
      .update({
        verification_status: 'rejected',
        rejection_reason: reason.trim(),
        verified_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to reject artist: ${updateError.message}`);
    }

    logger.info(
      { artistId: id, userId: artist.user_id, reason },
      'Artist rejected'
    );

    res.status(200).json({
      success: true,
      message: 'Artist verification rejected',
      data: { artist: updatedArtist },
    });
  } catch (error) {
    logger.error({ error, artistId: req.params.id }, 'Error rejecting artist');
    next(error);
  }
}

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
export async function getPlatformStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use the database function to get stats
    const { data: statsData, error: statsError } = await supabase.rpc(
      'get_marketplace_stats'
    );

    if (statsError) {
      logger.error({ error: statsError }, 'Error calling get_marketplace_stats function');
      // Fall back to manual queries
    }

    const stats = statsData || {};

    // Get additional stats not in the function
    const [
      { count: totalUsers },
      { count: totalArtists },
      { count: pendingArtists },
      { count: totalNFTs },
      { count: listedNFTs },
      { count: totalSales },
      { data: totalVolume },
      { data: totalFees },
      { data: avgPrice },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('artists')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'verified'),
      supabase
        .from('artists')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending'),
      supabase.from('nfts').select('*', { count: 'exact', head: true }),
      supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true })
        .eq('is_listed', true),
      supabase.from('sales').select('*', { count: 'exact', head: true }),
      supabase
        .from('sales')
        .select('sale_price_hbar.sum()')
        .single(),
      supabase
        .from('sales')
        .select('platform_fee_hbar.sum()')
        .single(),
      supabase
        .from('nfts')
        .select('price_hbar.avg()')
        .eq('is_listed', true)
        .single(),
    ]);

    // Get recent activity
    const { data: recentSales } = await supabase
      .from('sales')
      .select(
        `
        id,
        sale_price_hbar,
        transaction_id,
        created_at,
        nft:nfts(title, image_url),
        buyer:users!buyer_id(display_name, wallet_address),
        seller:users!seller_id(display_name, wallet_address)
      `
      )
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentNFTs } = await supabase
      .from('nfts')
      .select(
        `
        id,
        title,
        image_url,
        price_hbar,
        is_listed,
        created_at,
        creator:users!creator_id(display_name, wallet_address)
      `
      )
      .order('created_at', { ascending: false })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers || stats.total_users || 0,
          totalArtists: totalArtists || stats.total_artists || 0,
          pendingArtists: pendingArtists || stats.pending_artists || 0,
          totalNFTs: totalNFTs || stats.total_nfts || 0,
          listedNFTs: listedNFTs || stats.listed_nfts || 0,
          totalSales: totalSales || stats.total_sales || 0,
          totalVolumeHBAR: parseFloat(totalVolume?.sum || stats.total_volume_hbar || '0'),
          totalFeesCollectedHBAR: parseFloat(totalFees?.sum || stats.total_fees_collected_hbar || '0'),
          avgNFTPriceHBAR: parseFloat(avgPrice?.avg || stats.avg_nft_price_hbar || '0'),
        },
        recentActivity: {
          recentSales: recentSales || [],
          recentNFTs: recentNFTs || [],
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching platform stats');
    next(error);
  }
}