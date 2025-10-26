import { Client, AccountBalanceQuery } from '@hashgraph/sdk';
import dotenv from 'dotenv';
import path from 'path'

dotenv.config({path: path.resolve(__dirname, '../../.env')});

async function testHedera() {
  const client = Client.forTestnet();
  client.setOperator(
    process.env.HEDERA_OPERATOR_ID!,
    process.env.HEDERA_OPERATOR_KEY!
  );

  // Test 1: Check balance
  const balance = await new AccountBalanceQuery()
    .setAccountId(process.env.HEDERA_OPERATOR_ID!)
    .execute(client);

  console.log(`✅ Account Balance: ${balance.hbars.toString()}`);

  // Test 2: Verify collection token
  if (process.env.HEDERA_NFT_COLLECTION_ID) {
    console.log(`✅ NFT Collection: ${process.env.HEDERA_NFT_COLLECTION_ID}`);
  } else {
    console.log(`⚠️  No NFT collection created yet`);
  }
}

testHedera();
