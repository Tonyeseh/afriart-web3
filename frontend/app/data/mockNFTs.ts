import { NFT } from '../components/NFTCard';

export const mockNFTs: NFT[] = [
  {
    id: '1',
    title: 'Sunset over Kilimanjaro',
    image: 'https://images.unsplash.com/photo-1572988437129-0b167dcbb982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYXJ0JTIwcGFpbnRpbmclMjBkaWdpdGFsfGVufDF8fHx8MTc1ODMxMTM3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    price: 500,
    usdPrice: 125,
    creator: 'Amara Okafor',
    owner: '0.0.123456',
    technique: 'Digital Art',
    physicalCopy: true,
    listingType: 'sale',
    favoriteCount: 234,
    isWatched: false,
    isFavorited: false
  },
  {
    id: '2', 
    title: 'Abstract Rhythms',
    image: 'https://images.unsplash.com/photo-1516914732286-be0327632ce4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFmcmljYW4lMjBhcnR8ZW58MXx8fHwxNzU4MzExMzg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 750,
    usdPrice: 187.5,
    creator: 'Kwame Asante',
    owner: '0.0.789012',
    technique: 'Painting',
    physicalCopy: false,
    listingType: 'auction',
    currentBid: 600,
    bidCount: 7,
    timeLeft: 12.5,
    favoriteCount: 1420,
    isWatched: false,
    isFavorited: false
  },
  {
    id: '3',
    title: 'Serengeti Wildlife',
    image: 'https://images.unsplash.com/photo-1682668701024-b6508708a764?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwc2N1bHB0dXJlJTIwYXJ0fGVufDF8fHx8MTc1ODMxMTM3OXww&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1200,
    usdPrice: 300,
    creator: 'Zara Mthembu',
    owner: '0.0.345678',
    technique: 'Photography',
    physicalCopy: true,
    listingType: 'sale',
    favoriteCount: 892,
    isWatched: false,
    isFavorited: false
  },
  {
    id: '4',
    title: 'Traditional Patterns',
    image: 'https://images.unsplash.com/photo-1630084305900-b297cff3a608?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwdGV4dGlsZSUyMHBhdHRlcm5zfGVufDF8fHx8MTc1ODI4NzQ2NHww&ixlib=rb-4.1.0&q=80&w=1080',
    price: 300,
    usdPrice: 75,
    creator: 'Fatima Al-Hassan',
    owner: '0.0.567890',
    technique: 'Digital Art',
    physicalCopy: false,
    listingType: 'sale',
    favoriteCount: 156,
    isWatched: false,
    isFavorited: false
  },
  {
    id: '5',
    title: 'Urban Expression',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    price: 850,
    usdPrice: 212.5,
    creator: 'Themba Nkomo',
    owner: '0.0.432109',
    technique: 'Digital Art',
    physicalCopy: true,
    listingType: 'auction',
    currentBid: 700,
    bidCount: 4,
    timeLeft: 0.8,
    favoriteCount: 2340,
    isWatched: false,
    isFavorited: false
  },
  {
    id: '6',
    title: 'Ancestral Wisdom',
    image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=400&fit=crop',
    price: 650,
    usdPrice: 162.5,
    creator: 'Olumide Adebayo',
    owner: '0.0.901234',
    technique: 'Painting',
    physicalCopy: true,
    listingType: 'sale',
    favoriteCount: 567,
    isWatched: false,
    isFavorited: false
  },
  // Add more mock NFTs...
  ...Array.from({ length: 20 }, (_, i) => {
    const id = `${i + 7}`;
    return {
      id,
      title: `Artwork ${i + 7}`,
      image: `https://images.unsplash.com/photo-157${Math.floor(Math.random() * 9)}662996442-48f60103fc96?w=400&h=400&fit=crop`,
      price: Math.floor(Math.random() * 1000) + 100,
      usdPrice: Math.floor(Math.random() * 250) + 25,
      creator: ['Amara Okafor', 'Kwame Asante', 'Zara Mthembu', 'Fatima Al-Hassan'][Math.floor(Math.random() * 4)],
      owner: `0.0.${Math.floor(Math.random() * 900000) + 100000}`,
      technique: ['Digital Art', 'Painting', 'Photography', 'Sculpture'][Math.floor(Math.random() * 4)],
      physicalCopy: Math.random() > 0.5,
      listingType: Math.random() > 0.7 ? 'auction' as const : 'sale' as const,
      favoriteCount: Math.floor(Math.random() * 5000) + 10,
      isWatched: false,
      isFavorited: false,
      ...(Math.random() > 0.7 ? {
        currentBid: Math.floor(Math.random() * 800) + 200,
        bidCount: Math.floor(Math.random() * 10) + 1,
        timeLeft: Math.random() * 48
      } : {})
    };
  })
];
