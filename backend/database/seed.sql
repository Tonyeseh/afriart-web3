-- AfriArt NFT Marketplace - Seed Data
-- This script populates the database with test data for development

-- ============================================
-- CLEAR EXISTING DATA (for fresh seed)
-- ============================================
TRUNCATE TABLE user_favorites, sales, nfts, artists, users, platform_settings CASCADE;

-- ============================================
-- PLATFORM SETTINGS
-- ============================================
INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_fee_percent', '2', 'Platform commission fee percentage'),
  ('nft_collection_token_id', '', 'Hedera NFT collection token ID (empty until created)'),
  ('treasury_account_id', '', 'Platform treasury Hedera account ID'),
  ('max_image_size_mb', '50', 'Maximum image upload size in MB'),
  ('max_video_size_mb', '200', 'Maximum video upload size in MB'),
  ('min_nft_price_hbar', '1', 'Minimum NFT price in HBAR'),
  ('kyc_required', 'true', 'Whether KYC is required for artists'),
  ('maintenance_mode', 'false', 'Platform maintenance mode flag');

-- ============================================
-- TEST USERS
-- ============================================

-- Admin User
INSERT INTO users (id, wallet_address, role, display_name, email, bio, profile_picture_url, social_links) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '0.0.10001',
    'admin',
    'Platform Admin',
    'admin@afriart.io',
    'AfriArt platform administrator',
    NULL,
    '{"website": "https://afriart.io"}'
  );

-- Artist 1 (Verified)
INSERT INTO users (id, wallet_address, role, display_name, email, bio, profile_picture_url, social_links) VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    '0.0.20001',
    'artist',
    'Kwame Mensah',
    'kwame@example.com',
    'Contemporary artist from Accra, Ghana. Specializing in digital art and Afrofuturism.',
    'https://ipfs.io/ipfs/QmTestArtist1',
    '{
      "twitter": "https://twitter.com/kwame_art",
      "instagram": "https://instagram.com/kwame_mensah_art",
      "website": "https://kwameart.com"
    }'
  );

-- Artist 2 (Verified)
INSERT INTO users (id, wallet_address, role, display_name, email, bio, profile_picture_url, social_links) VALUES
  (
    '00000000-0000-0000-0000-000000000003',
    '0.0.20002',
    'artist',
    'Amara Okafor',
    'amara@example.com',
    'Mixed media artist from Lagos, Nigeria. Blending traditional African patterns with modern design.',
    'https://ipfs.io/ipfs/QmTestArtist2',
    '{
      "twitter": "https://twitter.com/amara_okafor",
      "instagram": "https://instagram.com/amara.art"
    }'
  );

-- Artist 3 (Pending Verification)
INSERT INTO users (id, wallet_address, role, display_name, email, bio, profile_picture_url, social_links) VALUES
  (
    '00000000-0000-0000-0000-000000000004',
    '0.0.20003',
    'artist',
    'Zainab Hassan',
    'zainab@example.com',
    'Photographer and visual artist from Cairo, Egypt.',
    'https://ipfs.io/ipfs/QmTestArtist3',
    '{
      "instagram": "https://instagram.com/zainab_captures"
    }'
  );

-- Buyer 1
INSERT INTO users (id, wallet_address, role, display_name, email, bio, social_links) VALUES
  (
    '00000000-0000-0000-0000-000000000005',
    '0.0.30001',
    'buyer',
    'John Collector',
    'john@example.com',
    'Art collector and Web3 enthusiast.',
    '{"twitter": "https://twitter.com/johncollects"}'
  );

-- Buyer 2
INSERT INTO users (id, wallet_address, role, display_name, email, bio) VALUES
  (
    '00000000-0000-0000-0000-000000000006',
    '0.0.30002',
    'buyer',
    'Sarah Investor',
    'sarah@example.com',
    'Supporting African artists through NFT investments.'
  );

-- Buyer 3
INSERT INTO users (id, wallet_address, role, display_name, email) VALUES
  (
    '00000000-0000-0000-0000-000000000007',
    '0.0.30003',
    'buyer',
    'Mike Williams',
    'mike@example.com'
  );

-- ============================================
-- ARTIST VERIFICATION DATA
-- ============================================

-- Kwame Mensah (Verified)
INSERT INTO artists (user_id, verification_status, kyc_documents, portfolio_urls, submitted_at, verified_at) VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    'verified',
    '["https://ipfs.io/ipfs/QmKYCDoc1", "https://ipfs.io/ipfs/QmKYCDoc2"]',
    '[
      "https://ipfs.io/ipfs/QmPortfolio1",
      "https://ipfs.io/ipfs/QmPortfolio2",
      "https://ipfs.io/ipfs/QmPortfolio3"
    ]',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '28 days'
  );

-- Amara Okafor (Verified)
INSERT INTO artists (user_id, verification_status, kyc_documents, portfolio_urls, submitted_at, verified_at) VALUES
  (
    '00000000-0000-0000-0000-000000000003',
    'verified',
    '["https://ipfs.io/ipfs/QmKYCDoc3", "https://ipfs.io/ipfs/QmKYCDoc4"]',
    '[
      "https://ipfs.io/ipfs/QmPortfolio4",
      "https://ipfs.io/ipfs/QmPortfolio5"
    ]',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '23 days'
  );

-- Zainab Hassan (Pending)
INSERT INTO artists (user_id, verification_status, kyc_documents, portfolio_urls, submitted_at) VALUES
  (
    '00000000-0000-0000-0000-000000000004',
    'pending',
    '["https://ipfs.io/ipfs/QmKYCDoc5"]',
    '[
      "https://ipfs.io/ipfs/QmPortfolio6",
      "https://ipfs.io/ipfs/QmPortfolio7",
      "https://ipfs.io/ipfs/QmPortfolio8"
    ]',
    NOW() - INTERVAL '2 days'
  );

-- ============================================
-- NFTs (Test Data)
-- ============================================

-- NFT 1 by Kwame (Listed for sale)
INSERT INTO nfts (
  id, token_id, serial_number, creator_id, owner_id,
  title, description, art_technique, art_material,
  image_url, image_ipfs_cid, metadata_url, metadata_ipfs_cid,
  file_type, file_size_bytes,
  price_hbar, price_usd, is_listed,
  view_count, favorite_count,
  minted_at
) VALUES (
  '00000000-0000-0000-0001-000000000001',
  '0.0.50001',
  1,
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Digital Harmony',
  'A vibrant exploration of African patterns in the digital age, combining traditional Adinkra symbols with futuristic elements.',
  'Digital Painting',
  'Digital',
  'https://ipfs.io/ipfs/QmNFT1Image',
  'QmNFT1Image',
  'https://ipfs.io/ipfs/QmNFT1Metadata',
  'QmNFT1Metadata',
  'image/png',
  2048000,
  50.00,
  15.00,
  true,
  156,
  12,
  NOW() - INTERVAL '20 days'
);

-- NFT 2 by Kwame (Listed for sale)
INSERT INTO nfts (
  id, token_id, serial_number, creator_id, owner_id,
  title, description, art_technique, art_material,
  image_url, image_ipfs_cid, metadata_url, metadata_ipfs_cid,
  file_type, file_size_bytes,
  price_hbar, price_usd, is_listed,
  view_count, favorite_count,
  minted_at
) VALUES (
  '00000000-0000-0000-0001-000000000002',
  '0.0.50002',
  2,
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Ancestral Voices',
  'Honoring the wisdom of our ancestors through abstract geometric forms.',
  'Digital Art',
  'Digital',
  'https://ipfs.io/ipfs/QmNFT2Image',
  'QmNFT2Image',
  'https://ipfs.io/ipfs/QmNFT2Metadata',
  'QmNFT2Metadata',
  'image/jpeg',
  3145728,
  75.00,
  22.50,
  true,
  203,
  18,
  NOW() - INTERVAL '18 days'
);

-- NFT 3 by Amara (Listed for sale)
INSERT INTO nfts (
  id, token_id, serial_number, creator_id, owner_id,
  title, description, art_technique, art_material,
  image_url, image_ipfs_cid, metadata_url, metadata_ipfs_cid,
  file_type, file_size_bytes,
  price_hbar, price_usd, is_listed,
  view_count, favorite_count,
  minted_at
) VALUES (
  '00000000-0000-0000-0001-000000000003',
  '0.0.50003',
  3,
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  'Lagos Nights',
  'Capturing the vibrant energy of Lagos nightlife through mixed media collage.',
  'Mixed Media',
  'Digital Collage',
  'https://ipfs.io/ipfs/QmNFT3Image',
  'QmNFT3Image',
  'https://ipfs.io/ipfs/QmNFT3Metadata',
  'QmNFT3Metadata',
  'image/png',
  4194304,
  100.00,
  30.00,
  true,
  342,
  25,
  NOW() - INTERVAL '15 days'
);

-- NFT 4 by Kwame (Sold to John)
INSERT INTO nfts (
  id, token_id, serial_number, creator_id, owner_id,
  title, description, art_technique, art_material,
  image_url, image_ipfs_cid, metadata_url, metadata_ipfs_cid,
  file_type, file_size_bytes,
  price_hbar, price_usd, is_listed,
  view_count, favorite_count,
  minted_at
) VALUES (
  '00000000-0000-0000-0001-000000000004',
  '0.0.50004',
  4,
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000005',
  'Golden Sunrise',
  'The beauty of an African sunrise captured in gold and amber tones.',
  'Digital Painting',
  'Digital',
  'https://ipfs.io/ipfs/QmNFT4Image',
  'QmNFT4Image',
  'https://ipfs.io/ipfs/QmNFT4Metadata',
  'QmNFT4Metadata',
  'image/jpeg',
  2621440,
  NULL,
  NULL,
  false,
  89,
  7,
  NOW() - INTERVAL '25 days'
);

-- NFT 5 by Amara (Not listed)
INSERT INTO nfts (
  id, token_id, serial_number, creator_id, owner_id,
  title, description, art_technique,
  image_url, image_ipfs_cid, metadata_url, metadata_ipfs_cid,
  file_type, file_size_bytes,
  is_listed,
  view_count, favorite_count,
  minted_at
) VALUES (
  '00000000-0000-0000-0001-000000000005',
  '0.0.50005',
  5,
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  'Cultural Tapestry',
  'Weaving together threads of African heritage and contemporary design.',
  'Digital Weaving',
  'https://ipfs.io/ipfs/QmNFT5Image',
  'QmNFT5Image',
  'https://ipfs.io/ipfs/QmNFT5Metadata',
  'QmNFT5Metadata',
  'image/png',
  5242880,
  false,
  45,
  3,
  NOW() - INTERVAL '10 days'
);

-- ============================================
-- SALES HISTORY
-- ============================================

-- Sale 1: Golden Sunrise sold by Kwame to John
INSERT INTO sales (
  nft_id, seller_id, buyer_id,
  sale_price_hbar, sale_price_usd,
  platform_fee_hbar, artist_receives_hbar,
  transaction_id
) VALUES (
  '00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000005',
  60.00,
  18.00,
  1.20,
  58.80,
  '0.0.12345@1234567890.123456789'
);

-- ============================================
-- USER FAVORITES
-- ============================================

-- John's favorites
INSERT INTO user_favorites (user_id, nft_id) VALUES
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000001'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000002'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000003'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000004');

-- Sarah's favorites
INSERT INTO user_favorites (user_id, nft_id) VALUES
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000001'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000003');

-- Mike's favorites
INSERT INTO user_favorites (user_id, nft_id) VALUES
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-000000000002'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-000000000003');

-- ============================================
-- VERIFICATION
-- ============================================

-- Display seed summary
DO $$
DECLARE
  user_count INTEGER;
  artist_count INTEGER;
  nft_count INTEGER;
  sale_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO artist_count FROM artists;
  SELECT COUNT(*) INTO nft_count FROM nfts;
  SELECT COUNT(*) INTO sale_count FROM sales;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'AfriArt Seed Data Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users created: %', user_count;
  RAISE NOTICE '  - Admins: %', (SELECT COUNT(*) FROM users WHERE role = 'admin');
  RAISE NOTICE '  - Artists: %', (SELECT COUNT(*) FROM users WHERE role = 'artist');
  RAISE NOTICE '  - Buyers: %', (SELECT COUNT(*) FROM users WHERE role = 'buyer');
  RAISE NOTICE 'Artists: %', artist_count;
  RAISE NOTICE '  - Verified: %', (SELECT COUNT(*) FROM artists WHERE verification_status = 'verified');
  RAISE NOTICE '  - Pending: %', (SELECT COUNT(*) FROM artists WHERE verification_status = 'pending');
  RAISE NOTICE 'NFTs: %', nft_count;
  RAISE NOTICE '  - Listed: %', (SELECT COUNT(*) FROM nfts WHERE is_listed = true);
  RAISE NOTICE '  - Sold: %', (SELECT COUNT(*) FROM nfts WHERE is_listed = false);
  RAISE NOTICE 'Sales: %', sale_count;
  RAISE NOTICE 'Favorites: %', (SELECT COUNT(*) FROM user_favorites);
  RAISE NOTICE '========================================';
END $$;
