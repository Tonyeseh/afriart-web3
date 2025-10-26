import { 
  TokenMintTransaction, 
  TokenId,
  TransactionReceipt,
  TransactionId
} from '@hashgraph/sdk';
import { HederaClient } from '../config/hedera';
import { metadataService } from './metadata.service';
import { ipfsService } from './ipfs.service';
import { supabase } from '../config/database';
import { logger } from '../config/logger';

export class NFTService {
  
  /**
   * Complete NFT minting workflow
   */
  async mintNFT(params: {
    title: string;
    description: string;
    creatorId: string;
    creatorWallet: string;
    creatorName: string;
    imageFile: Buffer;  // Image file data
    technique?: string;
    material?: string;
  }) {
    try {
      // Step 1: Upload image to IPFS
      logger.info({ title: params.title }, 'Uploading image to IPFS');
      const imageUpload = await ipfsService.uploadFile(params.imageFile, {
        name: `${params.title}.png`,
      });

      // Step 2: Generate HIP-412 metadata
      const metadata = metadataService.generateHIP412Metadata({
        name: params.title,
        description: params.description,
        creator: params.creatorName,
        creatorDID: `did:hedera:testnet:${params.creatorWallet}`,
        imageUrl: imageUpload.url,
        imageCid: imageUpload.cid,
        technique: params.technique,
        material: params.material,
      });

      // Step 3: Upload metadata to IPFS
      logger.info('Uploading metadata to IPFS');
      const metadataUpload = await ipfsService.uploadJSON(metadata, {
        name: `${params.title}-metadata.json`,
      });

      // Step 4: Mint NFT on Hedera
      logger.info('Minting NFT on Hedera');
      const { tokenId, serialNumber, transactionId } = await this.mintOnHedera(
        metadataUpload.cid
      );

      // Step 5: Save to database
      logger.info({ tokenId, serialNumber }, 'Saving NFT to database');
      const { data: nft, error } = await supabase
        .from('nfts')
        .insert({
          token_id: `${tokenId}.${serialNumber}`,
          serial_number: serialNumber,
          creator_id: params.creatorId,
          owner_id: params.creatorId,
          title: params.title,
          description: params.description,
          art_technique: params.technique,
          art_material: params.material,
          image_url: imageUpload.url,
          image_ipfs_cid: imageUpload.cid,
          metadata_url: metadataUpload.url,
          metadata_ipfs_cid: metadataUpload.cid,
          file_type: 'image/png',
          is_listed: false,
          minted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        nft,
        transaction: {
          tokenId: tokenId.toString(),
          serialNumber,
          transactionId,
        },
      };
    } catch (error) {
      logger.error({ error, title: params.title }, 'NFT minting failed');
      throw error;
    }
  }

  /**
   * Mint NFT on Hedera blockchain
   */
  private async mintOnHedera(metadataCid: string): Promise<{
    tokenId: TokenId;
    serialNumber: number;
    transactionId: string;
  }> {
    const client = HederaClient.getClient();
    const supplyKey = HederaClient.getOperatorKey();
    const tokenId = TokenId.fromString(process.env.HEDERA_NFT_COLLECTION_ID!);

    // CID as bytes (metadata pointer)
    const cidBytes = Buffer.from(metadataCid);

    // Create mint transaction
    const transaction = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([cidBytes])  // HIP-412: CID as metadata
      .freezeWith(client);

    // Sign and execute
    const signedTx = await transaction.sign(supplyKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    const serialNumber = receipt.serials[0].toNumber();

    return {
      tokenId,
      serialNumber,
      transactionId: txResponse.transactionId.toString(),
    };
  }

  /**
   * Transfer NFT to another account
   */
  async transferNFT(params: {
    tokenId: string;
    serialNumber: number;
    fromAccountId: string;
    toAccountId: string;
  }) {
    // Implementation for NFT transfer
    // Will be needed for sales in Week 6
  }
}

export const nftService = new NFTService();
