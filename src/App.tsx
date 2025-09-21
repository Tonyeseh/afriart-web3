import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Homepage } from './components/Homepage';
import { Gallery } from './components/Gallery';
import { ArtistDirectory } from './components/ArtistDirectory';
import { UserDashboard } from './components/UserDashboard';
import { PurchaseModal, PurchaseData } from './components/PurchaseModal';
import { CreateNFTModal } from './components/CreateNFTModal';
import { ToastProvider, useToast } from './components/Toast';
import { NFT } from './components/NFTCard';

function AppContent() {
  const { showToast } = useToast();
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

  // Enhanced NFT data with favorite counts and user interaction states
  const mockNFTs: NFT[] = [
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
      isWatched: watchedNFTs.includes('1'),
      isFavorited: favoritedNFTs.includes('1')
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
      isWatched: watchedNFTs.includes('2'),
      isFavorited: favoritedNFTs.includes('2')
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
      isWatched: watchedNFTs.includes('3'),
      isFavorited: favoritedNFTs.includes('3')
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
      isWatched: watchedNFTs.includes('4'),
      isFavorited: favoritedNFTs.includes('4')
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
      isWatched: watchedNFTs.includes('5'),
      isFavorited: favoritedNFTs.includes('5')
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
      isWatched: watchedNFTs.includes('6'),
      isFavorited: favoritedNFTs.includes('6')
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
        isWatched: watchedNFTs.includes(id),
        isFavorited: favoritedNFTs.includes(id),
        ...(Math.random() > 0.7 ? {
          currentBid: Math.floor(Math.random() * 800) + 200,
          bidCount: Math.floor(Math.random() * 10) + 1,
          timeLeft: Math.random() * 48
        } : {})
      };
    })
  ];

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
      case 'browse':
        setCurrentPage('gallery');
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

  const handleGetStarted = () => {
    if (isWalletConnected) {
      setCurrentPage('gallery');
    } else {
      handleConnectWallet();
    }
  };

  const handleCreateNFT = () => {
    if (!isWalletConnected) {
      showToast('error', 'Please connect your wallet first');
      return;
    }
    setShowCreateNFTModal(true);
  };

  const handleNFTCreated = (newNFT: NFT) => {
    setUserCreatedNFTs(prev => [newNFT, ...prev]);
    showToast('success', `"${newNFT.title}" has been minted successfully!`);
    // Navigate to portfolio
    setCurrentPage('portfolio');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'gallery':
        return (
          <Gallery 
            nfts={mockNFTs}
            onNFTAction={handleNFTAction}
          />
        );
      case 'artist':
        return (
          <ArtistDirectory 
            onViewArtist={(artist) => {
              console.log('View artist:', artist);
              showToast('success', `Viewing ${artist.displayName}'s profile`);
            }}
          />
        );
      case 'portfolio':
        if (!isWalletConnected) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-black">
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
      case 'about':
        return (
          <div className="min-h-screen bg-black py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl font-bold text-white mb-8 text-center">About AfriArt</h1>
              <div className="space-y-6 text-gray-300">
                <p className="text-lg">
                  AfriArt is the premier Web3 NFT marketplace dedicated to showcasing and celebrating African art. 
                  Built on the Hedera Hashgraph network, we provide a decentralized platform where African artists 
                  can mint, showcase, and monetize their creative works as NFTs.
                </p>
                <p>
                  Our mission is to bridge the gap between traditional African art and the digital world, 
                  providing artists with new opportunities to reach global audiences while preserving and 
                  promoting African cultural heritage through blockchain technology.
                </p>
                <p>
                  Features include direct sales, auction bidding, custom artwork commissions through our 
                  "Bring2Life" service, and physical art delivery for select pieces.
                </p>
              </div>
            </div>
          </div>
        );
      case 'home':
      default:
        return (
          <Homepage 
            onGetStarted={handleGetStarted}
            onViewCollection={() => setCurrentPage('gallery')}
            onNFTAction={handleNFTAction}
            featuredNFTs={mockNFTs.slice(0, 12)}
          />
        );
    }
  };

  return (
    <div className="dark min-h-screen bg-black text-white">
      <Navbar 
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      
      <main className="pt-16">
        {renderPage()}
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
        walletAddress={walletAddress}
        onSuccess={handleNFTCreated}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}