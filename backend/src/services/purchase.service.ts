import {
  TransferTransaction,
  Hbar,
  AccountId,
  TokenId,
  NftId,
  PrivateKey,
} from '@hashgraph/sdk';
import { HederaClient } from '../config/hedera';
import { supabase } from '../config/database';
import { logger } from '../config/logger';
import { mirrorNodeService } from './mirror.service';
import { ApiError } from '../types';

/**
 * Platform fee percentage (2%)
 */
const PLATFORM_FEE_PERCENT = 2;

/**
 * Service for handling NFT purchases on Hedera
 */
export class PurchaseService {
  /**
   * Complete NFT purchase workflow
   */
  async purchaseNFT(params: {
    nftId: string;
    buyerId: string;
    buyerWalletAddress: string;
    expectedPrice: number; // HBAR
  }): Promise<{
    sale: any;
    transactionId: string;
  }> {
    const { nftId, buyerId, buyerWalletAddress, expectedPrice } = params;

    try {
      // Step 1: Verify NFT is listed and price hasn't changed
      logger.info({ nftId, buyerId }, 'Starting NFT purchase');

      const { data: nft, error: nftError } = await supabase
        .from('nfts')
        .select('*, owner:users!owner_id(id, wallet_address)')
        .eq('id', nftId)
        .single();

      if (nftError || !nft) {
        throw new ApiError('NFT not found', 404);
      }

      if (!nft.is_listed) {
        throw new ApiError('NFT is not listed for sale', 400);
      }

      if (!nft.price_hbar) {
        throw new ApiError('NFT has no price set', 400);
      }

      const currentPrice = parseFloat(nft.price_hbar);

      if (Math.abs(currentPrice - expectedPrice) > 0.01) {
        throw new ApiError(
          `Price has changed. Current price: ${currentPrice} HBAR`,
          400
        );
      }

      // Step 2: Prevent self-purchase
      if (nft.owner_id === buyerId) {
        throw new ApiError('Cannot purchase your own NFT', 400);
      }

      // Step 3: Check for existing pending/completed purchase (idempotency)
      const { data: existingSale } = await supabase
        .from('sales')
        .select('*')
        .eq('nft_id', nftId)
        .eq('buyer_id', buyerId)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .maybeSingle();

      if (existingSale) {
        throw new ApiError(
          'A purchase for this NFT is already in progress or recently completed',
          409
        );
      }

      // Step 4: Calculate fees
      const priceInHbar = currentPrice;
      const platformFee = priceInHbar * (PLATFORM_FEE_PERCENT / 100);
      const sellerReceives = priceInHbar - platformFee;

      logger.info(
        {
          price: priceInHbar,
          platformFee,
          sellerReceives,
        },
        'Purchase amounts calculated'
      );

      // Step 5: Execute atomic transaction on Hedera
      // This transfers both HBAR and NFT in a single transaction
      const transactionId = await this.executeAtomicPurchase({
        buyerAccountId: buyerWalletAddress,
        sellerAccountId: nft.owner.wallet_address,
        platformTreasuryId: process.env.HEDERA_OPERATOR_ID!,
        tokenId: nft.token_id.split('.').slice(0, 3).join('.'), // Remove serial number
        serialNumber: nft.serial_number!,
        priceHbar: priceInHbar,
        platformFeeHbar: platformFee,
        sellerReceivesHbar: sellerReceives,
      });

      logger.info({ transactionId, nftId }, 'Hedera transaction executed');

      // Step 6: Wait for consensus
      logger.info('Waiting for Hedera consensus...');
      await mirrorNodeService.waitForConsensus(4);

      // Step 7: Verify transaction on Mirror Node
      logger.info({ transactionId }, 'Verifying transaction on Mirror Node');
      const verificationResult = await mirrorNodeService.getTransactionStatus(
        transactionId,
        10,
        2000
      );

      if (verificationResult.status !== 'SUCCESS') {
        throw new ApiError('Transaction failed on Hedera blockchain', 500);
      }

      // Step 8: Update NFT ownership in database
      logger.info({ nftId, newOwner: buyerId }, 'Updating NFT ownership');

      const { error: updateError } = await supabase
        .from('nfts')
        .update({
          owner_id: buyerId,
          is_listed: false,
          price_hbar: null,
          listed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', nftId);

      if (updateError) {
        logger.error({ error: updateError }, 'Failed to update NFT ownership');
        throw new ApiError('Failed to update NFT ownership in database', 500);
      }

      // Step 9: Create sale record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          nft_id: nftId,
          seller_id: nft.owner_id,
          buyer_id: buyerId,
          sale_price_hbar: priceInHbar.toString(),
          platform_fee_hbar: platformFee.toString(),
          artist_receives_hbar: sellerReceives.toString(),
          transaction_id: transactionId,
          status: 'completed',
        })
        .select()
        .single();

      if (saleError) {
        logger.error({ error: saleError }, 'Failed to create sale record');
        throw new ApiError('Failed to create sale record', 500);
      }

      logger.info({ saleId: sale.id, transactionId }, 'NFT purchase completed');

      return {
        sale,
        transactionId,
      };
    } catch (error) {
      logger.error({ error, nftId, buyerId }, 'NFT purchase failed');

      // If it's already an ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle Hedera SDK errors
      if (error instanceof Error) {
        if (error.message.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
          throw new ApiError('Insufficient HBAR balance', 400);
        }
        if (error.message.includes('INVALID_SIGNATURE')) {
          throw new ApiError('Invalid transaction signature', 400);
        }
      }

      throw new ApiError('Purchase failed. Please try again.', 500);
    }
  }

  /**
   * Execute atomic purchase transaction on Hedera
   * Transfers HBAR and NFT in single transaction
   */
  private async executeAtomicPurchase(params: {
    buyerAccountId: string;
    sellerAccountId: string;
    platformTreasuryId: string;
    tokenId: string;
    serialNumber: number;
    priceHbar: number;
    platformFeeHbar: number;
    sellerReceivesHbar: number;
  }): Promise<string> {
    const {
      buyerAccountId,
      sellerAccountId,
      platformTreasuryId,
      tokenId,
      serialNumber,
      priceHbar,
      platformFeeHbar,
      sellerReceivesHbar,
    } = params;

    const client = HederaClient.getClient();
    const operatorKey = HederaClient.getOperatorKey();

    try {
      // Create atomic transaction that:
      // 1. Transfers HBAR from buyer to seller (98%)
      // 2. Transfers HBAR from buyer to platform (2%)
      // 3. Transfers NFT from seller to buyer
      //
      // Note: In production, buyer would need to sign this transaction
      // For now, we use operator key (assuming operator controls all accounts in testnet)

      const transaction = new TransferTransaction()
        // HBAR transfers
        .addHbarTransfer(buyerAccountId, new Hbar(-priceHbar)) // Buyer pays
        .addHbarTransfer(sellerAccountId, new Hbar(sellerReceivesHbar)) // Seller receives 98%
        .addHbarTransfer(platformTreasuryId, new Hbar(platformFeeHbar)) // Platform receives 2%
        // NFT transfer
        .addNftTransfer(
          TokenId.fromString(tokenId),
          serialNumber,
          sellerAccountId,
          buyerAccountId
        )
        .freezeWith(client);

      // Sign with operator key
      // In production: buyer and seller would also need to sign
      const signedTx = await transaction.sign(operatorKey);

      // Execute transaction
      const txResponse = await signedTx.execute(client);

      // Get transaction ID
      const transactionId = txResponse.transactionId.toString();

      return transactionId;
    } catch (error) {
      logger.error({ error, params }, 'Failed to execute atomic purchase');
      throw error;
    }
  }

  /**
   * Get purchase history for a user
   */
  async getUserPurchases(userId: string): Promise<any[]> {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(
        `
        *,
        nft:nfts(*, creator:users!creator_id(display_name, wallet_address)),
        seller:users!seller_id(display_name, wallet_address)
      `
      )
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(`Failed to fetch purchase history: ${error.message}`, 500);
    }

    return sales || [];
  }

  /**
   * Get sales history for a seller
   */
  async getUserSales(userId: string): Promise<any[]> {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(
        `
        *,
        nft:nfts(*, creator:users!creator_id(display_name, wallet_address)),
        buyer:users!buyer_id(display_name, wallet_address)
      `
      )
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(`Failed to fetch sales history: ${error.message}`, 500);
    }

    return sales || [];
  }
}

export const purchaseService = new PurchaseService();
