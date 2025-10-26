/**
 * Database Connection Test Script
 *
 * Tests database connectivity and verifies schema setup
 *
 * Usage:
 *   pnpm tsx src/scripts/test-database.ts
 */

import dotenv from 'dotenv';
import { supabase } from '../config/database';
import { logger } from '../config/logger';
import path from 'path'

// Load environment variables
dotenv.config({path: path.resolve(__dirname, '../../.env')});

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, message: 'Success', duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    results.push({ name, passed: false, message, duration });
    console.log(`❌ ${name} (${duration}ms)`);
    console.error(`   Error: ${message}`);
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  AfriArt Database Connection Test    ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Test 1: Environment Variables
  await runTest('Environment Variables', async () => {
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL not set');
    }
    if (!process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_SERVICE_KEY not set');
    }
  });

  // Test 2: Basic Connection
  await runTest('Basic Connection', async () => {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  });

  // Test 3: Users Table
  await runTest('Users Table Schema', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(`Users table query failed: ${error.message}`);
    }

    // Verify expected columns exist
    if (data && data.length > 0) {
      const user = data[0];
      const requiredFields = [
        'id',
        'wallet_address',
        'role',
        'created_at',
        'updated_at',
      ];
      for (const field of requiredFields) {
        if (!(field in user)) {
          throw new Error(`Missing field: ${field}`);
        }
      }
    }
  });

  // Test 4: Artists Table
  await runTest('Artists Table Schema', async () => {
    const { error } = await supabase
      .from('artists')
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(`Artists table query failed: ${error.message}`);
    }
  });

  // Test 5: NFTs Table
  await runTest('NFTs Table Schema', async () => {
    const { error } = await supabase
      .from('nfts')
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(`NFTs table query failed: ${error.message}`);
    }
  });

  // Test 6: Sales Table
  await runTest('Sales Table Schema', async () => {
    const { error } = await supabase
      .from('sales')
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(`Sales table query failed: ${error.message}`);
    }
  });

  // Test 7: User Favorites Table
  await runTest('User Favorites Table Schema', async () => {
    const { error } = await supabase
      .from('user_favorites')
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(`User favorites table query failed: ${error.message}`);
    }
  });

  // Test 8: Platform Settings Table
  await runTest('Platform Settings Table Schema', async () => {
    const { error } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(`Platform settings table query failed: ${error.message}`);
    }
  });

  // Test 9: Check for Seed Data
  await runTest('Seed Data Check', async () => {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }

    if (count === 0) {
      throw new Error('No users found. Run seed.sql to populate test data.');
    }
  });

  // Test 10: Foreign Key Relationships
  await runTest('Foreign Key Relationships', async () => {
    const { data, error } = await supabase
      .from('nfts')
      .select(`
        *,
        creator:creator_id (wallet_address, display_name),
        owner:owner_id (wallet_address, display_name)
      `)
      .limit(1);

    if (error) {
      throw new Error(`Foreign key relationship test failed: ${error.message}`);
    }

    if (data && data.length > 0) {
      const nft = data[0] as any;
      if (!nft.creator || !nft.owner) {
        throw new Error('Foreign key relationships not working properly');
      }
    }
  });

  // Test 11: Write Permission
  await runTest('Write Permission Test', async () => {
    // Try to insert and delete a test user
    const testWallet = '0.0.999999999';

    // Insert
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        wallet_address: testWallet,
        role: 'buyer',
        display_name: 'Test User',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    // Delete
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('wallet_address', testWallet);

    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`);
    }
  });

  // Test 12: Update Permission
  await runTest('Update Permission Test', async () => {
    // Get first user
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('id, display_name')
      .limit(1);

    if (selectError || !users || users.length === 0) {
      throw new Error('No users found to test update');
    }

    const userId = users[0].id;
    const originalName = users[0].display_name;

    // Update
    const { error: updateError } = await supabase
      .from('users')
      .update({ display_name: 'Updated Test Name' })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }

    // Restore original
    await supabase
      .from('users')
      .update({ display_name: originalName })
      .eq('id', userId);
  });

  // Test 13: Connection Pool Stats
  await runTest('Connection Pool Info', async () => {
    // Supabase handles connection pooling automatically
    // This test just confirms we can make multiple concurrent requests
    const promises = Array.from({ length: 5 }, (_, i) =>
      supabase.from('users').select('count').limit(1)
    );

    const results = await Promise.all(promises);
    const failures = results.filter((r) => r.error);

    if (failures.length > 0) {
      throw new Error(`${failures.length}/5 concurrent requests failed`);
    }
  });

  // Print Summary
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║          Test Summary                 ║');
  console.log('╚═══════════════════════════════════════╝\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const avgDuration =
    results.reduce((sum, r) => sum + (r.duration || 0), 0) / total;

  console.log(`Total Tests:    ${total}`);
  console.log(`✅ Passed:      ${passed}`);
  console.log(`❌ Failed:      ${failed}`);
  console.log(`⏱️  Avg Time:    ${avgDuration.toFixed(2)}ms`);

  // Print Database Stats
  if (passed === total) {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║       Database Statistics             ║');
    console.log('╚═══════════════════════════════════════╝\n');

    try {
      const [usersCount, artistsCount, nftsCount, salesCount] =
        await Promise.all([
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('artists')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('nfts')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('sales')
            .select('*', { count: 'exact', head: true }),
        ]);

      console.log(`Users:          ${usersCount.count || 0}`);
      console.log(`Artists:        ${artistsCount.count || 0}`);
      console.log(`NFTs:           ${nftsCount.count || 0}`);
      console.log(`Sales:          ${salesCount.count || 0}`);
    } catch (error) {
      console.log('Could not fetch statistics');
    }
  }

  console.log('\n');

  // Exit with appropriate code
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run tests
main().catch((error) => {
  logger.error({ error }, 'Test script failed');
  console.error('Fatal error:', error);
  process.exit(1);
});
