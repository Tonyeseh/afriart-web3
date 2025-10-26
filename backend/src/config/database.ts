import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import dotenv from 'dotenv';
import path from 'path'

// Load environment variables
dotenv.config({path: path.resolve(__dirname, '../../.env')});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials in environment variables');
  throw new Error('Supabase configuration is required');
}

/**
 * Supabase client with optimized configuration for backend use
 *
 * Connection pooling is handled automatically by Supabase's infrastructure:
 * - Uses PgBouncer for connection pooling on the server side
 * - Supports up to 60 concurrent connections (default on free tier)
 * - Connection pool can be increased in Supabase dashboard settings
 *
 * For higher load, consider:
 * 1. Upgrade Supabase plan for more connections
 * 2. Use Supabase's connection pooler endpoint (add :6543 to URL)
 * 3. Implement request queuing for burst traffic
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'afriart-backend'
    }
  }
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('platform_settings')
      .select('key')
      .limit(1);

    if (error) {
      logger.error({ err: error }, 'Database connection test failed');
      return false;
    }

    logger.info('✅ Database connection successful');
    return true;
  } catch (err) {
    logger.error({ err }, 'Database connection error');
    return false;
  }
}
