"use client";

import { useState, useEffect } from 'react';
import { Gallery } from '../components/Gallery';
import { mockNFTs } from '../data/mockNFTs';
import { useToast } from '../components/Toast';
import { NFT } from '../components/NFTCard';
import { useAppState } from '../hooks/useAppState';
import { nftAPI } from '../utils/api';

export default function GalleryPage() {
  const { showToast } = useToast();
  const { watchedNFTs, setWatchedNFTs, favoritedNFTs, setFavoritedNFTs, isWalletConnected } = useAppState();
  const [nfts, setNfts] = useState<NFT[]>(mockNFTs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log(nfts, "nfts")

  // Fetch NFTs from API
  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await nftAPI.getNFTs({ limit: 100 });

        if (response.success && response.data?.nfts) {
          // Map API response to NFT format
          const fetchedNFTs: NFT[] = response.data.nfts.map((apiNft: any) => {
            // Helper to truncate address
            const truncateAddress = (addr: string) => {
              if (!addr || addr.length < 10) return addr;
              return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
            };

            // Get creator info from nested object or fall back to creator_id
            const creatorName = apiNft.creator?.display_name ||
                              (apiNft.creator?.wallet_address ? truncateAddress(apiNft.creator.wallet_address) : null) ||
                              (apiNft.creator_wallet ? truncateAddress(apiNft.creator_wallet) : null) ||
                              'Unknown Artist';

            // Get owner info - prefer current owner or fall back to creator
            const ownerAddress = apiNft.owner_wallet ||
                               apiNft.creator?.wallet_address ||
                               apiNft.creator_wallet ||
                               'Unknown';

            return {
              id: apiNft.id || apiNft.token_id,
              tokenId: apiNft.token_id,
              serialNumber: apiNft.serial_number,
              title: apiNft.title || 'Untitled',
              description: apiNft.description,
              image: apiNft.image_url || apiNft.image_ipfs_url || '',
              price: parseFloat(apiNft.price_hbar || '0'),
              usdPrice: parseFloat(apiNft.price_usd || '0'),
              creator: creatorName,
              owner: truncateAddress(ownerAddress),
              technique: apiNft.art_technique || 'Digital Art',
              material: apiNft.art_material || '',
              physicalCopy: apiNft.physical_copy_available || false,
              listingType: apiNft.is_listed ? 'sale' : 'sale',
              isWatched: false,
              isFavorited: false,
            };
          });

          setNfts(fetchedNFTs.length > 0 ? fetchedNFTs : mockNFTs);
        } else {
          // Fallback to mock data if no NFTs
          setNfts(mockNFTs);
        }
      } catch (err: any) {
        console.error('Error fetching NFTs:', err);
        setError(err.message || 'Failed to load NFTs');
        // Fallback to mock data on error
        setNfts(mockNFTs);
        showToast('warning', 'Using sample data. Connect to backend to see real NFTs.');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [showToast]);

  const handleWatchToggle = (nft: NFT) => {
    if (!isWalletConnected) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    const isCurrentlyWatched = watchedNFTs.includes(nft.id);

    if (isCurrentlyWatched) {
      setWatchedNFTs(prev => prev.filter(id => id !== nft.id));
      showToast('success', `Removed "${nft.title}" from watchlist`);
    } else {
      setWatchedNFTs(prev => [...prev, nft.id]);
      showToast('success', `Added "${nft.title}" to watchlist`);
    }
  };

  const handleFavoriteToggle = (nft: NFT) => {
    const isCurrentlyFavorited = favoritedNFTs.includes(nft.id);
    
    if (isCurrentlyFavorited) {
      setFavoritedNFTs(prev => prev.filter(id => id !== nft.id));
      showToast('success', `Removed "${nft.title}" from favorites`);
    } else {
      setFavoritedNFTs(prev => [...prev, nft.id]);
      showToast('success', `Added "${nft.title}" to favorites`);
    }
  };

  const handleNFTAction = (action: string, nft: NFT) => {
    if (!isWalletConnected && (action === 'buy' || action === 'bid' || action === 'offer')) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    switch (action) {
      case 'watch':
        handleWatchToggle(nft);
        break;
      case 'favorite':
        handleFavoriteToggle(nft);
        break;
      default:
        console.log(`Action: ${action}`, nft);
    }
  };

  // Update NFTs with current watch/favorite states
  const nftsWithStates = nfts.map(nft => ({
    ...nft,
    isWatched: watchedNFTs.includes(nft.id),
    isFavorited: favoritedNFTs.includes(nft.id)
  }));

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400">Loading NFTs...</p>
        </div>
      </div>
    );
  }

  if(nfts.length === 0)
    return(
  <p>No nfts</p>
  )

  return (
    <Gallery
      initialNfts={nfts}
      onNFTAction={handleNFTAction}
    />
  );
}
