import { 
  Client, 
  TokenCreateTransaction, 
  TokenType, 
  TokenSupplyType,
  PrivateKey 
} from '@hashgraph/sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.resolve(__dirname, '../../.env')});

async function createNFTCollection() {
    // set up client
    const client = Client.forTestnet();
    console.log(process.env.HEDERA_OPERATOR_ID!, 'hedera_operator_id')
    client.setOperator(
        process.env.HEDERA_OPERATOR_ID!,
        process.env.HEDERA_OPERATOR_KEY!
    );

    const treasuryKey = PrivateKey.fromStringDer(process.env.HEDERA_OPERATOR_KEY!);

    // Create the NFT collection
    const transaction = await new TokenCreateTransaction()
    .setTokenName('AfriArt NFT')
    .setTokenSymbol('AFRIART')
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(process.env.HEDERA_OPERATOR_ID!)
    .setSupplyType(TokenSupplyType.Infinite) // can mint unlimited NFTs
    .setSupplyKey(treasuryKey) // who can mint
    .setAdminKey(treasuryKey) // who can modify token
    .freezeWith(client);

    const signedTx =  await transaction.sign(treasuryKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    const tokenId = receipt.tokenId;
    console.log(`✅ NFT Collection created: ${tokenId}`);
  console.log(`Add this to your .env: HEDERA_NFT_COLLECTION_ID=${tokenId}`);

  return tokenId;
}

createNFTCollection();