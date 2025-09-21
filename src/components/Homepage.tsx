import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { ChevronRight, Users } from 'lucide-react';
import { NFTCard, NFT } from './NFTCard';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HomepageProps {
  onGetStarted: () => void;
  onViewCollection: () => void;
  onNFTAction: (action: string, nft: NFT) => void;
  featuredNFTs: NFT[];
}

export function Homepage({ onGetStarted, onViewCollection, onNFTAction, featuredNFTs }: HomepageProps) {
  const communityMembers = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=40&h=40&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=40&h=40&fit=crop&crop=face"
  ];

  const collections = [
    {
      name: "Digital Painting",
      nfts: featuredNFTs.slice(0, 4)
    },
    {
      name: "Traditional Art", 
      nfts: featuredNFTs.slice(4, 8)
    },
    {
      name: "Photography",
      nfts: featuredNFTs.slice(8, 12)
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-white">Discover </span>
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    African Art
                  </span>
                  <span className="text-white"> on Web3</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-lg">
                  The premier NFT marketplace showcasing the finest African art. 
                  Connect with talented artists and own unique digital masterpieces on the Hedera blockchain.
                </p>
              </div>

              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>

              {/* Community Stats */}
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {communityMembers.map((avatar, index) => (
                    <img
                      key={index}
                      src={avatar}
                      alt="Community member"
                      className="w-10 h-10 rounded-full border-2 border-black"
                    />
                  ))}
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">47k+</div>
                  <div className="text-sm text-gray-400">community members</div>
                </div>
              </div>
            </div>

            {/* Right Side - Carousel */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {featuredNFTs.slice(0, 4).map((nft, index) => (
                  <Card 
                    key={nft.id}
                    className={`bg-gray-900 border-gray-800 overflow-hidden hover:scale-105 transition-transform duration-300 ${
                      index % 2 === 0 ? 'translate-y-4' : '-translate-y-4'
                    }`}
                  >
                    <ImageWithFallback
                      src={nft.image}
                      alt={nft.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <h3 className="text-white font-semibold text-sm truncate">{nft.title}</h3>
                      <p className="text-purple-400 text-sm">{nft.price} HBAR</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AfriArt Collection Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">AfriArt Collection</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Check out some of our latest art from several categories
            </p>
          </div>

          <div className="space-y-12">
            {collections.map((collection, index) => (
              <div key={index} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">{collection.name}</h3>
                  <Button 
                    variant="link" 
                    onClick={onViewCollection}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    View All <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {collection.nfts.map((nft) => (
                    <NFTCard
                      key={nft.id}
                      nft={nft}
                      onBuy={(nft) => onNFTAction('buy', nft)}
                      onMakeOffer={(nft) => onNFTAction('offer', nft)}
                      onBid={(nft) => onNFTAction('bid', nft)}
                      onWatch={(nft) => onNFTAction('watch', nft)}
                      onFavorite={(nft) => onNFTAction('favorite', nft)}
                      variant="homepage"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button 
              onClick={onViewCollection}
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
            >
              View All Collection
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            From Africa's Greatest to the World
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Africa's largest Art NFT collection now available on-chain powered by Hedera.
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4"
          >
            Get Started
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}