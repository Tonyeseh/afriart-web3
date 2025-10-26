"use client";

import { useState } from 'react';
import { NFT } from '../components/NFTCard';
import { PurchaseData } from '../components/PurchaseModal';

export function useAppState() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showCreateNFTModal, setShowCreateNFTModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<'buy' | 'bid' | 'offer'>('buy');
  const [userCreatedNFTs, setUserCreatedNFTs] = useState<NFT[]>([]);
  
  // User interaction state
  const [watchedNFTs, setWatchedNFTs] = useState<string[]>([]);
  const [favoritedNFTs, setFavoritedNFTs] = useState<string[]>([]);

  return {
    currentPage,
    setCurrentPage,
    isWalletConnected,
    setIsWalletConnected,
    walletAddress,
    setWalletAddress,
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
  };
}
