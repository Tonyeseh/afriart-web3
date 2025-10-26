"use client";

import { UserDashboard } from '../components/UserDashboard';
import { mockNFTs } from '../data/mockNFTs';
import { useToast } from '../components/Toast';
import { NFT } from '../components/NFTCard';
import { useAppState } from '../hooks/useAppState';

export default function PortfolioPage() {
  const { showToast } = useToast();
  const { 
    isWalletConnected, 
    setIsWalletConnected, 
    setWalletAddress,
    watchedNFTs, 
    favoritedNFTs,
    userCreatedNFTs 
  } = useAppState();

  const handleConnectWallet = () => {
    // Mock wallet connection
    setIsWalletConnected(true);
    setWalletAddress('0.0.123456');
    showToast('success', 'Wallet connected successfully!');
  };

  const handleWatchToggle = (nft: NFT) => {
    if (!isWalletConnected) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    const isCurrentlyWatched = watchedNFTs.includes(nft.id);
    
    if (isCurrentlyWatched) {
      showToast('success', `Removed "${nft.title}" from watchlist`);
    } else {
      showToast('success', `Added "${nft.title}" to watchlist`);
    }
  };

  const handleFavoriteToggle = (nft: NFT) => {
    const isCurrentlyFavorited = favoritedNFTs.includes(nft.id);
    
    if (isCurrentlyFavorited) {
      showToast('success', `Removed "${nft.title}" from favorites`);
    } else {
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

  const handleCreateNFT = () => {
    if (!isWalletConnected) {
      showToast('error', 'Please connect your wallet first');
      return;
    }
    showToast('info', 'Create NFT functionality would open here');
  };

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to access your portfolio</p>
          <button 
            onClick={handleConnectWallet}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <UserDashboard 
      userNFTs={mockNFTs.slice(0, 3)}
      userCreations={[...userCreatedNFTs, ...mockNFTs.slice(3, 6)]}
      watchedNFTs={mockNFTs.filter(nft => watchedNFTs.includes(nft.id))}
      favoritedNFTs={mockNFTs.filter(nft => favoritedNFTs.includes(nft.id))}
      onNFTAction={handleNFTAction}
      onCreateNFT={handleCreateNFT}
    />
  );
}
