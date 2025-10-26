"use client";

import { ReactNode, useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PurchaseModal, PurchaseData } from './PurchaseModal';
import { CreateNFTModal } from './CreateNFTModal';
import { RegistrationModal } from './RegistrationModal';
import { useToast } from './Toast';
import { NFT } from './NFTCard';
import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../../contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { showToast } = useToast();
  const { user, isAuthenticated, connectWallet, disconnectWallet, error: authError } = useAuth();
  const {
    showPurchaseModal,
    setShowPurchaseModal,
    showCreateNFTModal,
    setShowCreateNFTModal,
    selectedNFT,
    setSelectedNFT,
    purchaseMode,
    setPurchaseMode,
    userCreatedNFTs,
    setUserCreatedNFTs,
    watchedNFTs,
    setWatchedNFTs,
    favoritedNFTs,
    setFavoritedNFTs,
  } = useAppState();

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingWalletAddress, setPendingWalletAddress] = useState<string>('');

  // Handle auth errors and show registration modal when needed
  useEffect(() => {
    if (authError === 'NEW_USER_REGISTRATION_NEEDED') {
      const walletAddr = sessionStorage.getItem('pending_wallet_address');
      if (walletAddr) {
        setPendingWalletAddress(walletAddr);
        setShowRegistrationModal(true);
      }
    } else if (authError && authError !== 'NEW_USER_REGISTRATION_NEEDED') {
      showToast('error', authError);
    }
  }, [authError]);

  // Show success toast when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      showToast('success', `Welcome back, ${user.displayName || 'User'}!`);
    }
  }, [isAuthenticated]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error: any) {
      // Error already handled by AuthContext and useEffect above
      console.error('Wallet connection error:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    showToast('success', 'Wallet disconnected');
  };

  const handleRegistrationComplete = () => {
    setShowRegistrationModal(false);
    setPendingWalletAddress('');
    showToast('success', 'Registration completed! Welcome to AfriArt!');
  };

  const handleWatchToggle = (nft: NFT) => {
    if (!isAuthenticated) {
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
    if (!isAuthenticated && (action === 'buy' || action === 'bid' || action === 'offer')) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    switch (action) {
      case 'buy':
        setSelectedNFT(nft);
        setPurchaseMode('buy');
        setShowPurchaseModal(true);
        break;
      case 'bid':
        setSelectedNFT(nft);
        setPurchaseMode('bid');
        setShowPurchaseModal(true);
        break;
      case 'offer':
        setSelectedNFT(nft);
        setPurchaseMode('offer');
        setShowPurchaseModal(true);
        break;
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

  const handlePurchaseConfirm = (data: PurchaseData) => {
    console.log('Purchase data:', data);

    if (purchaseMode === 'buy') {
      showToast('success', `Successfully purchased "${selectedNFT?.title}"!`);
    } else if (purchaseMode === 'bid') {
      showToast('success', `Bid placed on "${selectedNFT?.title}"!`);
    } else if (purchaseMode === 'offer') {
      showToast('success', `Offer submitted for "${selectedNFT?.title}"!`);
    }

    if (data.includePhysical) {
      showToast('warning', 'Physical copy request submitted to artist');
    }
  };

  const handleCreateNFT = () => {
    if (!isAuthenticated) {
      showToast('error', 'Please connect your wallet first');
      return;
    }
    setShowCreateNFTModal(true);
  };

  const handleNFTCreated = (newNFT: NFT) => {
    setUserCreatedNFTs(prev => [newNFT, ...prev]);
    showToast('success', `"${newNFT.title}" has been minted successfully!`);
  };

  return (
    <div className="dark min-h-screen bg-black text-white">
      <Navbar
        isWalletConnected={isAuthenticated}
        walletAddress={user?.walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      <main className="pt-16">
        {children}
      </main>

      <Footer />

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        nft={selectedNFT}
        mode={purchaseMode}
        onConfirm={handlePurchaseConfirm}
      />

      <CreateNFTModal
        isOpen={showCreateNFTModal}
        onClose={() => setShowCreateNFTModal(false)}
        walletAddress={user?.walletAddress || ''}
        onSuccess={handleNFTCreated}
      />

      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setPendingWalletAddress('');
          sessionStorage.removeItem('pending_wallet_address');
        }}
        walletAddress={pendingWalletAddress}
      />
    </div>
  );
}
