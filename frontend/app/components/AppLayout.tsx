"use client";

import { ReactNode, useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PurchaseModal } from './PurchaseModal';
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

  console.log(user, "user logged")

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

  // const handlePurchaseConfirm = (data: PurchaseData) => {
  //   console.log('Purchase data:', data);

  //   if (purchaseMode === 'buy') {
  //     showToast('success', `Successfully purchased "${selectedNFT?.title}"!`);
  //   } else if (purchaseMode === 'bid') {
  //     showToast('success', `Bid placed on "${selectedNFT?.title}"!`);
  //   } else if (purchaseMode === 'offer') {
  //     showToast('success', `Offer submitted for "${selectedNFT?.title}"!`);
  //   }

  //   if (data.includePhysical) {
  //     showToast('warning', 'Physical copy request submitted to artist');
  //   }
  // };

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

      {/* <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        nft={selectedNFT}
        onSuccess={() => console.log("Art purchased")}
        buyerWallet={user.walletAddress || "wallet address"}
      /> */}

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
