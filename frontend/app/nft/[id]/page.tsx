'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import {
  ArrowLeft,
  Share2,
  Heart,
  Clock,
  TrendingUp,
  User,
  Twitter,
  Instagram,
  Globe,
  ExternalLink,
  Loader2,
  AlertCircle,
  Package,
  CheckCircle,
} from 'lucide-react';
import { nftAPI, userAPI } from '../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { PurchaseModal } from '../../components/PurchaseModal';

interface NFT {
  id: string;
  token_id: string;
  creator_wallet: string;
  owner_wallet?: string;
  title: string;
  description?: string;
  image_url: string;
  technique: string;
  material?: string;
  price?: number;
  physical_copy_available: boolean;
  physical_copy_price?: number;
  shipping_cost?: number;
  ipfs_hash?: string;
  listing_type?: 'sale' | 'auction';
  auction_end_time?: string;
  current_bid?: number;
  bid_count?: number;
  created_at?: string;
}

interface Creator {
  wallet_address: string;
  display_name?: string;
  bio?: string;
  profile_picture_url?: string;
  social_links?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

interface Transaction {
  type: string;
  from: string;
  to: string;
  amount?: number;
  timestamp: string;
  transactionId: string;
}

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const nftId = params.id as string;

  // State
  const [nft, setNft] = useState<NFT | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'digital' | 'physical'>('digital');

  // Fetch NFT details
  useEffect(() => {
    const fetchNFTDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch NFT data
        const nftResponse = await nftAPI.getNFT(nftId);
        if (!nftResponse.success || !nftResponse.data) {
          throw new Error('NFT not found');
        }

        const nftData = nftResponse.data;
        setNft(nftData);

        // Fetch creator information
        if (nftData.creator_wallet) {
          try {
            const creatorResponse = await userAPI.getProfile(nftData.creator_wallet);
            if (creatorResponse.success && creatorResponse.data) {
              setCreator(creatorResponse.data);
            }
          } catch (err) {
            console.error('Error fetching creator:', err);
            // Continue even if creator fetch fails
          }
        }

        // Fetch transaction history from Hedera Mirror Node
        // This is a mock implementation - in production, query Hedera Mirror Node API
        setTransactions([
          {
            type: 'Minted',
            from: nftData.creator_wallet,
            to: nftData.creator_wallet,
            timestamp: nftData.created_at || new Date().toISOString(),
            transactionId: `0.0.${Math.random().toString(36).substr(2, 9)}`,
          },
        ]);
      } catch (err) {
        console.error('Error fetching NFT details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load NFT details');
      } finally {
        setLoading(false);
      }
    };

    if (nftId) {
      fetchNFTDetails();
    }
  }, [nftId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: nft?.title,
        text: `Check out this NFT: ${nft?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleBuyNow = (type: 'digital' | 'physical') => {
    if (!isAuthenticated) {
      alert('Please connect your wallet to purchase');
      return;
    }

    setPurchaseType(type);
    setShowPurchaseModal(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeLeft = (endTime?: string) => {
    if (!endTime) return null;
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Auction ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-400">Loading NFT...</h3>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !nft) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading NFT</h3>
          <p className="text-gray-500 mb-4">{error || 'NFT not found'}</p>
          <Button
            onClick={() => router.push('/gallery')}
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
          >
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.walletAddress === nft.owner_wallet;
  const price = nft.listing_type === 'auction' ? nft.current_bid : nft.price;
  const usdPrice = price ? price * 0.25 : 0; // Mock conversion rate

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <CardContent className="p-0">
                <ImageWithFallback
                  src={nft.image_url}
                  alt={nft.title}
                  className="w-full aspect-square object-cover"
                />
              </CardContent>
            </Card>

            {/* Physical Copy Badge */}
            {nft.physical_copy_available && (
              <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-700">
                <CardContent className="p-4 flex items-center gap-3">
                  <Package className="h-5 w-5 text-purple-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">Physical Copy Available</p>
                    <p className="text-sm text-gray-300">
                      Artist can create a physical version of this artwork
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction History */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  Transaction History
                </h3>
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">{tx.type}</span>
                          <span className="text-xs text-gray-500">{formatDate(tx.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                        </p>
                        {tx.amount && (
                          <p className="text-sm text-green-400 font-semibold mt-1">
                            {tx.amount} HBAR
                          </p>
                        )}
                        <a
                          href={`https://hashscan.io/testnet/transaction/${tx.transactionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
                        >
                          View on HashScan
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title and Actions */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{nft.title}</h1>
                <Badge className="bg-purple-600/20 text-purple-400 border-purple-600">
                  {nft.technique}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`border-gray-700 ${
                    isFavorited ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="border-gray-700 text-gray-400 hover:text-white"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Creator Information */}
            {creator && (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">CREATOR</h3>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-purple-500">
                      <AvatarImage src={creator.profile_picture_url} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-lg">
                        {creator.display_name || 'Anonymous Artist'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {creator.wallet_address.slice(0, 6)}...{creator.wallet_address.slice(-4)}
                      </p>
                      {creator.bio && (
                        <p className="text-sm text-gray-300 mt-2">{creator.bio}</p>
                      )}
                      {/* Social Links */}
                      {creator.social_links && (
                        <div className="flex gap-2 mt-3">
                          {creator.social_links.twitter && (
                            <a
                              href={creator.social_links.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-purple-400"
                            >
                              <Twitter className="h-4 w-4" />
                            </a>
                          )}
                          {creator.social_links.instagram && (
                            <a
                              href={creator.social_links.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-purple-400"
                            >
                              <Instagram className="h-4 w-4" />
                            </a>
                          )}
                          {creator.social_links.website && (
                            <a
                              href={creator.social_links.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-purple-400"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {nft.description && (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">DESCRIPTION</h3>
                  <p className="text-gray-300 leading-relaxed">{nft.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Price and Purchase */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-700">
              <CardContent className="p-6">
                {nft.listing_type === 'auction' ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Current Bid</p>
                        <p className="text-3xl font-bold text-white">
                          {nft.current_bid || nft.price} HBAR
                        </p>
                        <p className="text-sm text-gray-400">≈ ${usdPrice.toFixed(2)} USD</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Time Left
                        </p>
                        <p className="text-xl font-semibold text-purple-400">
                          {formatTimeLeft(nft.auction_end_time)}
                        </p>
                      </div>
                    </div>
                    <Separator className="my-4 bg-gray-700" />
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span>{nft.bid_count || 0} bids</span>
                      <span>Ends {formatDate(nft.auction_end_time)}</span>
                    </div>
                    {!isOwner && (
                      <Button
                        onClick={() => handleBuyNow('digital')}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6"
                        disabled={!isAuthenticated}
                      >
                        Place Bid
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-1">Price</p>
                      <p className="text-3xl font-bold text-white">{nft.price} HBAR</p>
                      <p className="text-sm text-gray-400">≈ ${usdPrice.toFixed(2)} USD</p>
                    </div>
                    {!isOwner && (
                      <div className="space-y-3">
                        <Button
                          onClick={() => handleBuyNow('digital')}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6"
                          disabled={!isAuthenticated}
                        >
                          Buy Now
                        </Button>
                        {nft.physical_copy_available && nft.physical_copy_price && (
                          <Button
                            onClick={() => handleBuyNow('physical')}
                            variant="outline"
                            className="w-full border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white py-6"
                            disabled={!isAuthenticated}
                          >
                            <Package className="h-5 w-5 mr-2" />
                            Order Physical Copy ({nft.physical_copy_price} HBAR)
                          </Button>
                        )}
                      </div>
                    )}
                    {isOwner && (
                      <div className="text-center py-4 text-gray-400">
                        You own this NFT
                      </div>
                    )}
                    {!isAuthenticated && (
                      <p className="text-center text-sm text-gray-500 mt-4">
                        Connect your wallet to purchase
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* NFT Details */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">NFT DETAILS</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Token ID</span>
                    <span className="text-white font-mono">{nft.token_id}</span>
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Technique</span>
                    <span className="text-white">{nft.technique}</span>
                  </div>
                  {nft.material && (
                    <>
                      <Separator className="bg-gray-800" />
                      <div className="flex justify-between">
                        <span className="text-gray-400">Material</span>
                        <span className="text-white">{nft.material}</span>
                      </div>
                    </>
                  )}
                  <Separator className="bg-gray-800" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blockchain</span>
                    <span className="text-white">Hedera</span>
                  </div>
                  {nft.ipfs_hash && (
                    <>
                      <Separator className="bg-gray-800" />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">IPFS</span>
                        <a
                          href={`https://ipfs.io/ipfs/${nft.ipfs_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          View on IPFS
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {nft && showPurchaseModal && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          nft={{
            id: nft.id,
            tokenId: nft.token_id,
            title: nft.title,
            image: nft.image_url,
            price: purchaseType === 'physical' ? (nft.physical_copy_price || nft.price || 0) : (nft.price || 0),
            usdPrice: usdPrice,
            creator: nft.creator_wallet,
            technique: nft.technique,
            physicalCopy: purchaseType === 'physical',
          }}
          buyerWallet={user?.walletAddress || ''}
          onSuccess={() => {
            setShowPurchaseModal(false);
            router.push('/portfolio');
          }}
        />
      )}
    </div>
  );
}
