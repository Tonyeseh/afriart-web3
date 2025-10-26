import { nftAPI, userAPI } from './api';

export const seedUsers = [
  {
    wallet_address: '0.0.123456',
    display_name: 'Amara Okafor',
    profile_picture_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
    social_links: {
      twitter: '@amaraokafor',
      instagram: '@amara_art',
      website: 'https://amaraokafor.art'
    }
  },
  {
    wallet_address: '0.0.789012',
    display_name: 'Kwame Asante',
    profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    social_links: {
      twitter: '@kwameasante',
      website: 'https://kwameasante.com'
    }
  },
  {
    wallet_address: '0.0.345678',
    display_name: 'Zara Mthembu',
    profile_picture_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    social_links: {
      instagram: '@zara_wildlife',
      website: 'https://zaraphotography.co.za'
    }
  }
];

export const seedNFTs = [
  {
    token_id: 'nft_001',
    creator_wallet: '0.0.123456',
    title: 'Sunset over Kilimanjaro',
    image_url: 'https://images.unsplash.com/photo-1572988437129-0b167dcbb982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYXJ0JTIwcGFpbnRpbmclMjBkaWdpdGFsfGVufDF8fHx8MTc1ODMxMTM3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    technique: 'Digital Art',
    physical_copy_available: true,
    physical_copy_price: 50,
    shipping_cost: 25
  },
  {
    token_id: 'nft_002',
    creator_wallet: '0.0.789012',
    title: 'Abstract Rhythms',
    image_url: 'https://images.unsplash.com/photo-1516914732286-be0327632ce4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFmcmljYW4lMjBhcnR8ZW58MXx8fHwxNzU4MzExMzg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    technique: 'Painting',
    physical_copy_available: false
  },
  {
    token_id: 'nft_003',
    creator_wallet: '0.0.345678',
    title: 'Serengeti Wildlife',
    image_url: 'https://images.unsplash.com/photo-1682668701024-b6508708a764?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwc2N1bHB0dXJlJTIwYXJ0fGVufDF8fHx8MTc1ODMxMTM3OXww&ixlib=rb-4.1.0&q=80&w=1080',
    technique: 'Photography',
    physical_copy_available: true,
    physical_copy_price: 75,
    shipping_cost: 30
  },
  {
    token_id: 'nft_004',
    creator_wallet: '0.0.123456',
    title: 'Traditional Patterns',
    image_url: 'https://images.unsplash.com/photo-1630084305900-b297cff3a608?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwdGV4dGlsZSUyMHBhdHRlcm5zfGVufDF8fHx8MTc1ODI4NzQ2NHww&ixlib=rb-4.1.0&q=80&w=1080',
    technique: 'Digital Art',
    physical_copy_available: false
  }
];

export async function seedDatabase() {
  try {
    console.log('Seeding database with demo data...');
    
    // Create users
    for (const user of seedUsers) {
      try {
        await userAPI.createProfile(user);
        console.log(`Created user: ${user.display_name}`);
      } catch (error) {
        console.log(`User ${user.display_name} might already exist`);
      }
    }
    
    // Create NFTs
    for (const nft of seedNFTs) {
      try {
        await nftAPI.createNFT(nft);
        console.log(`Created NFT: ${nft.title}`);
      } catch (error) {
        console.log(`NFT ${nft.title} might already exist`);
      }
    }
    
    console.log('Database seeding completed!');
    return true;
  } catch (error) {
    console.error('Failed to seed database:', error);
    return false;
  }
}