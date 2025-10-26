-- AfriArt NFT Marketplace Database Schema (MVP)
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(50) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'artist', 'admin')),
  display_name VARCHAR(100),
  email VARCHAR(255),
  bio TEXT,
  profile_picture_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster wallet lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- ARTISTS TABLE
-- ============================================
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  kyc_documents JSONB DEFAULT '[]', -- Array of IPFS URLs
  portfolio_urls JSONB DEFAULT '[]', -- Array of image URLs
  rejection_reason TEXT,
  submitted_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_artists_user ON artists(user_id);
CREATE INDEX idx_artists_status ON artists(verification_status);

-- ============================================
-- NFTS TABLE
-- ============================================
CREATE TABLE nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id VARCHAR(100) UNIQUE NOT NULL, -- Hedera token ID (0.0.xxxxx)
  serial_number INTEGER, -- NFT serial number from HTS
  creator_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),

  -- Basic info
  title VARCHAR(200) NOT NULL,
  description TEXT,
  art_technique VARCHAR(50),
  art_material VARCHAR(50),

  -- File info
  image_url TEXT NOT NULL, -- IPFS gateway URL
  image_ipfs_cid VARCHAR(100), -- IPFS CID
  metadata_url TEXT, -- IPFS metadata JSON URL
  metadata_ipfs_cid VARCHAR(100), -- Metadata CID
  file_type VARCHAR(20), -- image/jpeg, image/png, video/mp4
  file_size_bytes BIGINT,

  -- Pricing
  price_hbar DECIMAL(20, 8),
  price_usd DECIMAL(20, 2), -- Snapshot at listing time
  is_listed BOOLEAN DEFAULT TRUE,

  -- Stats
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  minted_at TIMESTAMP,

  CONSTRAINT valid_price CHECK (price_hbar IS NULL OR price_hbar > 0)
);

CREATE INDEX idx_nfts_token ON nfts(token_id);
CREATE INDEX idx_nfts_creator ON nfts(creator_id);
CREATE INDEX idx_nfts_owner ON nfts(owner_id);
CREATE INDEX idx_nfts_listed ON nfts(is_listed) WHERE is_listed = TRUE;
CREATE INDEX idx_nfts_technique ON nfts(art_technique);
CREATE INDEX idx_nfts_price ON nfts(price_hbar) WHERE price_hbar IS NOT NULL;

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_id UUID REFERENCES nfts(id),
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),

  sale_price_hbar DECIMAL(20, 8) NOT NULL,
  sale_price_usd DECIMAL(20, 2), -- Snapshot at sale time
  platform_fee_hbar DECIMAL(20, 8), -- 2% of sale price
  artist_receives_hbar DECIMAL(20, 8), -- 98% of sale price

  transaction_id VARCHAR(100), -- Hedera transaction ID

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_nft ON sales(nft_id);
CREATE INDEX idx_sales_buyer ON sales(buyer_id);
CREATE INDEX idx_sales_seller ON sales(seller_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, nft_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_favorites_nft ON user_favorites(nft_id);

-- ============================================
-- PLATFORM SETTINGS TABLE
-- ============================================
CREATE TABLE platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_fee_percent', '2', 'Platform commission percentage'),
  ('nft_collection_token_id', '""', 'Hedera NFT collection token ID - set by setup script'),
  ('treasury_account_id', '""', 'Platform treasury Hedera account ID'),
  ('max_image_size_mb', '50', 'Maximum image file size in MB'),
  ('max_video_size_mb', '200', 'Maximum video file size in MB'),
  ('min_nft_price_hbar', '1', 'Minimum NFT listing price in HBAR'),
  ('max_nft_price_hbar', '1000000', 'Maximum NFT listing price in HBAR')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply to nfts table
CREATE TRIGGER update_nfts_updated_at
BEFORE UPDATE ON nfts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS FOR STATS
-- ============================================

-- Get marketplace statistics
CREATE OR REPLACE FUNCTION get_marketplace_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_nfts', (SELECT COUNT(*) FROM nfts),
    'total_users', (SELECT COUNT(*) FROM users),
    'total_artists', (SELECT COUNT(*) FROM artists WHERE verification_status = 'verified'),
    'pending_artists', (SELECT COUNT(*) FROM artists WHERE verification_status = 'pending'),
    'total_sales', (SELECT COUNT(*) FROM sales),
    'total_volume_hbar', (SELECT COALESCE(SUM(sale_price_hbar), 0) FROM sales),
    'total_fees_collected_hbar', (SELECT COALESCE(SUM(platform_fee_hbar), 0) FROM sales),
    'listed_nfts', (SELECT COUNT(*) FROM nfts WHERE is_listed = TRUE),
    'avg_nft_price_hbar', (SELECT COALESCE(AVG(price_hbar), 0) FROM nfts WHERE price_hbar IS NOT NULL AND is_listed = TRUE)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get artist statistics
CREATE OR REPLACE FUNCTION get_artist_stats(artist_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_nfts_created', (SELECT COUNT(*) FROM nfts WHERE creator_id = artist_user_id),
    'total_nfts_sold', (SELECT COUNT(*) FROM sales WHERE seller_id = artist_user_id),
    'total_earnings_hbar', (SELECT COALESCE(SUM(artist_receives_hbar), 0) FROM sales WHERE seller_id = artist_user_id),
    'avg_sale_price_hbar', (SELECT COALESCE(AVG(sale_price_hbar), 0) FROM sales WHERE seller_id = artist_user_id),
    'total_favorites', (
      SELECT COALESCE(SUM(favorite_count), 0)
      FROM nfts
      WHERE creator_id = artist_user_id
    ),
    'total_views', (
      SELECT COALESCE(SUM(view_count), 0)
      FROM nfts
      WHERE creator_id = artist_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- ============================================

-- Enable RLS on sensitive tables (if using Supabase auth)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be added based on authentication method

-- ============================================
-- SEED DATA (Development Only)
-- ============================================

-- Create admin user (for testing)
INSERT INTO users (wallet_address, role, display_name, email) VALUES
  ('0.0.999999', 'admin', 'Platform Admin', 'admin@afriart.xyz')
ON CONFLICT (wallet_address) DO NOTHING;

-- ============================================
-- USEFUL QUERIES (For Reference)
-- ============================================

-- Get all listed NFTs with creator info
-- SELECT n.*, u.display_name as creator_name, u.profile_picture_url as creator_avatar
-- FROM nfts n
-- JOIN users u ON n.creator_id = u.id
-- WHERE n.is_listed = TRUE
-- ORDER BY n.created_at DESC;

-- Get user's NFT collection
-- SELECT n.*
-- FROM nfts n
-- WHERE n.owner_id = 'user_uuid_here'
-- ORDER BY n.created_at DESC;

-- Get artist's sales history
-- SELECT s.*, n.title as nft_title, n.image_url
-- FROM sales s
-- JOIN nfts n ON s.nft_id = n.id
-- WHERE s.seller_id = 'artist_user_id_here'
-- ORDER BY s.created_at DESC;

-- Get pending artist verifications
-- SELECT a.*, u.display_name, u.email, u.wallet_address
-- FROM artists a
-- JOIN users u ON a.user_id = u.id
-- WHERE a.verification_status = 'pending'
-- ORDER BY a.submitted_at ASC;
