"use client";

import { Gallery } from '../components/Gallery';
import { mockNFTs } from '../data/mockNFTs';
import { useToast } from '../components/Toast';
import { NFT } from '../components/NFTCard';
import { useAppState } from '../hooks/useAppState';

export default function GalleryPage() {
  const { showToast } = useToast();
  const { watchedNFTs, setWatchedNFTs, favoritedNFTs, setFavoritedNFTs, isWalletConnected } = useAppState();

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
  const nftsWithStates = mockNFTs.map(nft => ({
    ...nft,
    isWatched: watchedNFTs.includes(nft.id),
    isFavorited: favoritedNFTs.includes(nft.id)
  }));

  return (
    <Gallery 
      nfts={nftsWithStates}
      onNFTAction={handleNFTAction}
    />
  );
}
