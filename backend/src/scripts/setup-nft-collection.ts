import {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar,
} from '@hashgraph/sdk';
import { HederaClient } from '../config/hedera';
import { supabase } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to create AfriArt NFT Collection on Hedera
 *
 * This script:
 * 1. Creates a new NFT collection token on Hedera
 * 2. Configures token properties (name, symbol, supply key)
 * 3. Saves collection token ID to database settings table
 * 4. Outputs token ID for .env configuration
 *
 * Run: pnpm nft:setup
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function main() {
  log('\n🎨 AfriArt NFT Collection Setup\n', 'blue');

  try {
    // Step 1: Initialize Hedera Client
    log('1. Initializing Hedera client...', 'cyan');
    const client = HederaClient.getClient();
    const operatorKey = HederaClient.getOperatorKey();
    const network = process.env.HEDERA_NETWORK || 'testnet';

    log(`   Connected to ${network}`, 'gray');
    log(`   Operator: ${process.env.HEDERA_OPERATOR_ID}`, 'gray');

    // Step 2: Check if collection already exists
    log('\n2. Checking for existing collection...', 'cyan');
    const { data: existingSettings } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'nft_collection_token_id')
      .single();

    const existingTokenId = existingSettings?.value && existingSettings.value !== '""' ? existingSettings.value.replace(/"/g, '') : null;

    if (existingTokenId) {
      log(`   ⚠️  Collection already exists: ${existingTokenId}`, 'yellow');
      log(
        '   To create a new collection, delete the existing setting from database',
        'gray'
      );

      const confirm = process.argv.includes('--force');
      if (!confirm) {
        log('\n   Use --force flag to create anyway (not recommended)', 'gray');
        log('\n❌ Setup cancelled\n', 'red');
        process.exit(0);
      }

      log('   --force flag detected, creating new collection...', 'yellow');
    }

    // Step 3: Create NFT Collection Token
    log('\n3. Creating AfriArt NFT Collection on Hedera...', 'cyan');

    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName('AfriArt NFT Collection')
      .setTokenSymbol('AFRIART')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Infinite)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(process.env.HEDERA_OPERATOR_ID!)
      .setSupplyKey(operatorKey.publicKey)
      .setAdminKey(operatorKey.publicKey)
      .setMaxTransactionFee(new Hbar(30))
      .freezeWith(client);

    const signedTx = await tokenCreateTx.sign(operatorKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const tokenId = receipt.tokenId;

    if (!tokenId) {
      throw new Error('Failed to create NFT collection - no token ID returned');
    }

    log(`   ✅ Collection created!`, 'green');
    log(`   Token ID: ${tokenId.toString()}`, 'gray');
    log(`   Transaction: ${txResponse.transactionId.toString()}`, 'gray');

    // Step 4: Save to Database
    log('\n4. Saving collection token ID to database...', 'cyan');

    const { error: upsertError } = await supabase
      .from('platform_settings')
      .upsert(
        {
          key: 'nft_collection_token_id',
          value: `"${tokenId.toString()}"`, // JSONB format
          description: 'AfriArt NFT Collection Token ID on Hedera',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      );

    if (upsertError) {
      log(`   ⚠️  Failed to save to database: ${upsertError.message}`, 'yellow');
      log(
        '   You will need to manually add this to your platform_settings table',
        'gray'
      );
    } else {
      log(`   ✅ Saved to database platform_settings table`, 'green');
    }

    // Step 5: Output configuration
    log('\n5. Configuration Complete!', 'green');
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('\n📋 Add this to your .env file:\n', 'yellow');
    log(`HEDERA_NFT_COLLECTION_ID=${tokenId.toString()}`, 'green');
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

    // Step 6: Display collection details
    log('\n📊 Collection Details:\n', 'blue');
    log(`   Name: AfriArt NFT Collection`, 'gray');
    log(`   Symbol: AFRIART`, 'gray');
    log(`   Type: Non-Fungible Unique (NFT)`, 'gray');
    log(`   Supply Type: Infinite`, 'gray');
    log(`   Token ID: ${tokenId.toString()}`, 'gray');
    log(`   Network: ${network}`, 'gray');
    log(`   Treasury: ${process.env.HEDERA_OPERATOR_ID}`, 'gray');

    // Step 7: Next steps
    log('\n📝 Next Steps:\n', 'yellow');
    log('   1. Add HEDERA_NFT_COLLECTION_ID to your .env file', 'gray');
    log('   2. Restart your backend server', 'gray');
    log('   3. Test NFT minting with: pnpm nft:test', 'gray');
    log('   4. View your collection on HashScan:', 'gray');
    if (network === 'testnet') {
      log(
        `      https://hashscan.io/testnet/token/${tokenId.toString()}`,
        'cyan'
      );
    } else {
      log(
        `      https://hashscan.io/mainnet/token/${tokenId.toString()}`,
        'cyan'
      );
    }

    log('\n✅ NFT Collection Setup Complete!\n', 'green');
    process.exit(0);
  } catch (error) {
    log('\n❌ NFT Collection Setup Failed\n', 'red');

    if (error instanceof Error) {
      log(`Error: ${error.message}`, 'red');

      if (error.message.includes('credentials not configured')) {
        log('\n💡 Solution:', 'yellow');
        log('   Make sure these environment variables are set:', 'gray');
        log('   - HEDERA_OPERATOR_ID (your Hedera account ID)', 'gray');
        log('   - HEDERA_OPERATOR_KEY (your private key in DER format)', 'gray');
        log('   - HEDERA_NETWORK (testnet or mainnet)', 'gray');
      }

      if (error.message.includes('INSUFFICIENT_PAYER_BALANCE')) {
        log('\n💡 Solution:', 'yellow');
        log('   Your Hedera account needs more HBAR', 'gray');
        log('   For testnet, get free HBAR from:', 'gray');
        log('   https://portal.hedera.com/faucet', 'cyan');
      }

      if (error.message.includes('Database')) {
        log('\n💡 Solution:', 'yellow');
        log('   Check your Supabase connection:', 'gray');
        log('   - SUPABASE_URL is set correctly', 'gray');
        log('   - SUPABASE_SERVICE_KEY is set correctly', 'gray');
        log('   - Settings table exists in database', 'gray');
      }
    }

    log('\n');
    process.exit(1);
  }
}

// Run setup
main().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}\n`, 'red');
  process.exit(1);
});
