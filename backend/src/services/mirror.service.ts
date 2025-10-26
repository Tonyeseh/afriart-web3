import axios from 'axios';
import { logger } from '../config/logger';

/**
 * Transaction status from Mirror Node
 */
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

/**
 * Mirror Node transaction response
 */
interface MirrorTransaction {
  consensus_timestamp: string;
  transaction_id: string;
  result: string;
  name: string;
  charged_tx_fee: number;
  transfers: Array<{
    account: string;
    amount: number;
  }>;
  nft_transfers?: Array<{
    receiver_account_id: string;
    sender_account_id: string;
    serial_number: number;
    token_id: string;
  }>;
}

/**
 * Service for interacting with Hedera Mirror Node API
 * Docs: https://docs.hedera.com/hedera/sdks-and-apis/rest-api
 */
export class MirrorNodeService {
  private baseUrl: string;

  constructor() {
    const network = process.env.HEDERA_NETWORK || 'testnet';
    this.baseUrl = network === 'mainnet'
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
  }

  /**
   * Get transaction status from Mirror Node
   * Polls until transaction is confirmed or timeout
   */
  async getTransactionStatus(
    transactionId: string,
    maxRetries: number = 10,
    retryDelayMs: number = 2000
  ): Promise<{
    status: TransactionStatus;
    transaction?: MirrorTransaction;
  }> {
    logger.info({ transactionId }, 'Checking transaction status on Mirror Node');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait before checking (Mirror Node needs time to process)
        if (attempt > 1) {
          await this.sleep(retryDelayMs);
        }

        const response = await axios.get(
          `${this.baseUrl}/api/v1/transactions/${transactionId}`,
          {
            timeout: 10000,
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        const transactions = response.data?.transactions;

        if (!transactions || transactions.length === 0) {
          logger.debug(
            { transactionId, attempt },
            'Transaction not yet available on Mirror Node'
          );
          continue;
        }

        const transaction = transactions[0] as MirrorTransaction;

        // Check result
        if (transaction.result === 'SUCCESS') {
          logger.info({ transactionId }, 'Transaction confirmed on Mirror Node');
          return {
            status: 'SUCCESS',
            transaction,
          };
        } else {
          logger.error(
            { transactionId, result: transaction.result },
            'Transaction failed on Hedera'
          );
          return {
            status: 'FAILED',
            transaction,
          };
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            logger.debug(
              { transactionId, attempt },
              'Transaction not found yet (404), retrying...'
            );
            continue;
          }

          logger.error(
            { error: error.message, transactionId, attempt },
            'Error checking Mirror Node'
          );
        } else {
          logger.error({ error, transactionId, attempt }, 'Unexpected error');
        }

        if (attempt === maxRetries) {
          throw new Error('Transaction verification timeout');
        }
      }
    }

    return { status: 'PENDING' };
  }

  /**
   * Verify NFT transfer completed
   */
  async verifyNftTransfer(
    transactionId: string,
    expectedTokenId: string,
    expectedSerialNumber: number,
    expectedReceiver: string
  ): Promise<boolean> {
    try {
      const result = await this.getTransactionStatus(transactionId);

      if (result.status !== 'SUCCESS' || !result.transaction) {
        return false;
      }

      const nftTransfers = result.transaction.nft_transfers || [];

      // Find matching NFT transfer
      const transfer = nftTransfers.find(
        (t) =>
          t.token_id === expectedTokenId &&
          t.serial_number === expectedSerialNumber &&
          t.receiver_account_id === expectedReceiver
      );

      return !!transfer;
    } catch (error) {
      logger.error({ error, transactionId }, 'Failed to verify NFT transfer');
      return false;
    }
  }

  /**
   * Verify HBAR transfer completed
   */
  async verifyHbarTransfer(
    transactionId: string,
    expectedReceiver: string,
    expectedAmountTinybars: number
  ): Promise<boolean> {
    try {
      const result = await this.getTransactionStatus(transactionId);

      if (result.status !== 'SUCCESS' || !result.transaction) {
        return false;
      }

      const transfers = result.transaction.transfers || [];

      // Find matching HBAR transfer
      const transfer = transfers.find(
        (t) => t.account === expectedReceiver && t.amount === expectedAmountTinybars
      );

      return !!transfer;
    } catch (error) {
      logger.error({ error, transactionId }, 'Failed to verify HBAR transfer');
      return false;
    }
  }

  /**
   * Wait for consensus (recommended: 3-5 seconds)
   */
  async waitForConsensus(seconds: number = 3): Promise<void> {
    await this.sleep(seconds * 1000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mirrorNodeService = new MirrorNodeService();
