import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Heart, Clock, Users, Eye, EyeOff } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { formatNumber } from '../utils/formatNumber';

export interface NFT {
  id: string;
  title: string;
  image: string;
  price: number; // In HBAR
  usdPrice: number;
  creator: string;
  owner: string;
  technique: string;
  physicalCopy: boolean;
  listingType: 'sale' | 'auction';
  // Auction specific fields
  currentBid?: number;
  bidCount?: number;
  timeLeft?: number; // in hours
  // User interaction states
  isWatched?: boolean;
  isFavorited?: boolean;
  favoriteCount?: number;
  tokenId: string
}

interface NFTCardProps {
  nft: NFT;
  onBuy?: (nft: NFT) => void;
  onMakeOffer?: (nft: NFT) => void;
  onBid?: (nft: NFT) => void;
  onWatch?: (nft: NFT) => void;
  onFavorite?: (nft: NFT) => void;
  variant?: 'homepage' | 'gallery';
}

export function NFTCard({ nft, onBuy, onMakeOffer, onBid, onWatch, onFavorite, variant = 'gallery' }: NFTCardProps) {

  const formatTimeLeft = (hours: number) => {
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 1) return `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m`;
    return `${Math.floor(hours * 60)}m`;
  };

  const getTimeColor = (hours: number) => {
    if (hours > 24) return 'text-green-400';
    if (hours > 1) return 'text-orange-400';
    return 'text-red-400';
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all duration-300 group">
      <div className="relative">
        <ImageWithFallback
          src={nft.image}
          alt={nft.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Favorite button with count */}
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2 py-1 bg-black/70 rounded-full">
            <button
              onClick={() => onFavorite?.(nft)}
              className="hover:scale-110 transition-transform"
            >
              <Heart className={`h-4 w-4 ${nft.isFavorited ? 'fill-red-500 text-red-500' : 'text-white hover:text-red-500'}`} />
            </button>
            {nft.favoriteCount && nft.favoriteCount > 0 && (
              <span className="text-xs text-white font-medium">
                {formatNumber(nft.favoriteCount)}
              </span>
            )}
          </div>
        </div>

        {/* Auction timer */}
        {nft.listingType === 'auction' && nft.timeLeft && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/80 rounded-md flex items-center space-x-1">
            <Clock className="h-3 w-3 text-white" />
            <span className={`text-xs ${getTimeColor(nft.timeLeft)}`}>
              {formatTimeLeft(nft.timeLeft)}
            </span>
          </div>
        )}

        {/* Technique badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-purple-600/80 text-white">
            {nft.technique}
          </Badge>
        </div>

        {/* Bid count for auctions */}
        {nft.listingType === 'auction' && nft.bidCount && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded-md flex items-center space-x-1">
            <Users className="h-3 w-3 text-white" />
            <span className="text-xs text-white">{nft.bidCount}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold mb-2 truncate">{nft.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Creator</span>
            <span className="text-white">{nft.creator}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Owner</span>
            <span className="text-white">{truncateAddress(nft.owner)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Physical Copy</span>
            <span className={nft.physicalCopy ? 'text-green-400' : 'text-gray-400'}>
              {nft.physicalCopy ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-xl font-bold text-white">
            {nft.listingType === 'auction' && nft.currentBid 
              ? `${nft.currentBid.toLocaleString()} HBAR`
              : `${nft.price.toLocaleString()} HBAR`
            }
          </div>
          <div className="text-sm text-green-400">
            ${nft.usdPrice.toLocaleString()} USD
          </div>
          {nft.listingType === 'auction' && (
            <div className="text-xs text-gray-400">Current bid</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {nft.listingType === 'sale' ? (
            <>
              <Button 
                onClick={() => onBuy?.(nft)}
                className="flex-1 bg-white text-black hover:bg-gray-200"
              >
                Buy
              </Button>
              <Button 
                onClick={() => onMakeOffer?.(nft)}
                variant="outline"
                className="flex-1 border-white text-white hover:bg-white hover:text-black"
              >
                Make Offer
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => onBid?.(nft)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Bid
              </Button>
              <Button 
                onClick={() => onWatch?.(nft)}
                variant="outline"
                className={`flex-1 ${nft.isWatched 
                  ? 'border-green-500 text-green-400 hover:bg-green-500' 
                  : 'border-purple-500 text-purple-400 hover:bg-purple-500'
                } hover:text-white transition-colors`}
              >
                {nft.isWatched ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Unwatch
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Watch
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}