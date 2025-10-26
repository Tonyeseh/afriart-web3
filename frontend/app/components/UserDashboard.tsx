import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Plus, Edit, Clock, Check, X, Package, Truck, CheckCircle } from 'lucide-react';
import { NFTCard, NFT } from './NFTCard';

interface UserDashboardProps {
  userNFTs: NFT[];
  userCreations: NFT[];
  watchedNFTs: NFT[];
  favoritedNFTs: NFT[];
  onNFTAction: (action: string, nft: NFT) => void;
  onCreateNFT: () => void;
}

interface PhysicalOrder {
  id: string;
  nftTitle: string;
  nftImage: string;
  artist: string;
  buyer: string;
  status: 'pending' | 'accepted' | 'declined' | 'shipped' | 'completed';
  contactDetails?: string;
  contactMethod?: string;
  price: number;
  shippingCost: number;
}

interface BidItem {
  id: string;
  nft: NFT;
  bidAmount: number;
  status: 'active' | 'won' | 'lost' | 'ended';
  timeLeft?: number;
}

export function UserDashboard({ userNFTs, userCreations, watchedNFTs, favoritedNFTs, onNFTAction, onCreateNFT }: UserDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    displayName: 'John Doe',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    socialLinks: {
      twitter: '@johndoe',
      instagram: '@johndoe_art',
      website: 'https://johndoe.art'
    }
  });

  // Mock data for physical orders and bids
  const mockPhysicalOrders: PhysicalOrder[] = [
    {
      id: '1',
      nftTitle: 'Sunset over Kilimanjaro',
      nftImage: 'https://images.unsplash.com/photo-1572988437129-0b167dcbb982?w=200&h=200&fit=crop',
      artist: 'Amara Okafor',
      buyer: '0.0.123456',
      status: 'pending',
      contactDetails: 'john@example.com',
      contactMethod: 'email',
      price: 500,
      shippingCost: 25
    }
  ];

  const mockBids: BidItem[] = [
    {
      id: '1',
      nft: userNFTs[0],
      bidAmount: 750,
      status: 'active',
      timeLeft: 5.5
    }
  ];

  const handleSaveProfile = () => {
    setIsEditing(false);
    // In real app, would save to backend
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'accepted': return 'bg-blue-600';
      case 'declined': return 'bg-red-600';
      case 'shipped': return 'bg-purple-600';
      case 'completed': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <Check className="h-4 w-4" />;
      case 'declined': return <X className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.profilePicture} />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
                  <p className="text-gray-400">Digital Artist & Collector</p>
                </div>
              </div>
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    value={profile.displayName}
                    onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profile Picture URL</Label>
                  <Input 
                    value={profile.profilePicture}
                    onChange={(e) => setProfile({...profile, profilePicture: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter</Label>
                  <Input 
                    value={profile.socialLinks.twitter}
                    onChange={(e) => setProfile({
                      ...profile, 
                      socialLinks: {...profile.socialLinks, twitter: e.target.value}
                    })}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input 
                    value={profile.socialLinks.instagram}
                    onChange={(e) => setProfile({
                      ...profile, 
                      socialLinks: {...profile.socialLinks, instagram: e.target.value}
                    })}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="md:col-span-2 flex space-x-2">
                  <Button onClick={handleSaveProfile} className="bg-purple-600 hover:bg-purple-700">
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="collection" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="collection">My Collection</TabsTrigger>
            <TabsTrigger value="creations">My Creations</TabsTrigger>
            <TabsTrigger value="watching">Watching</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="bids">My Bids</TabsTrigger>
            <TabsTrigger value="physical">Physical Art</TabsTrigger>
          </TabsList>

          {/* My Collection */}
          <TabsContent value="collection">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">My Collection ({userNFTs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {userNFTs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {userNFTs.map((nft) => (
                      <div key={nft.id} className="relative">
                        <NFTCard
                          nft={nft}
                          onBuy={(nft) => onNFTAction('list-sale', nft)}
                          onMakeOffer={(nft) => onNFTAction('list-auction', nft)}
                        />
                        <div className="absolute bottom-4 left-4 right-4 flex space-x-2 z-10">
                          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                            List for Sale
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 border-blue-500 text-blue-400">
                            List for Auction
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">You don't own any NFTs yet</p>
                    <Button onClick={() => onNFTAction('browse', {} as NFT)} className="mt-4">
                      Browse Gallery
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Creations */}
          <TabsContent value="creations">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">My Creations ({userCreations.length})</CardTitle>
                <Button onClick={onCreateNFT} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Art
                </Button>
              </CardHeader>
              <CardContent>
                {userCreations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {userCreations.map((nft) => (
                      <NFTCard
                        key={nft.id}
                        nft={nft}
                        onBuy={(nft) => onNFTAction('edit', nft)}
                        onMakeOffer={(nft) => onNFTAction('analytics', nft)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Plus className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">You haven't created any NFTs yet</p>
                    <Button onClick={onCreateNFT} className="mt-4 bg-purple-600 hover:bg-purple-700">
                      Create Your First NFT
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Watching */}
          <TabsContent value="watching">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Watched NFTs ({watchedNFTs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {watchedNFTs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {watchedNFTs.map((nft) => (
                      <NFTCard
                        key={nft.id}
                        nft={nft}
                        onBuy={(nft) => onNFTAction('buy', nft)}
                        onMakeOffer={(nft) => onNFTAction('offer', nft)}
                        onBid={(nft) => onNFTAction('bid', nft)}
                        onWatch={(nft) => onNFTAction('watch', nft)}
                        onFavorite={(nft) => onNFTAction('favorite', nft)}
                        variant="gallery"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">You're not watching any NFTs</p>
                    <Button 
                      onClick={() => onNFTAction('browse', {} as NFT)} 
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                    >
                      Browse Gallery
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Favorite NFTs ({favoritedNFTs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {favoritedNFTs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favoritedNFTs.map((nft) => (
                      <NFTCard
                        key={nft.id}
                        nft={nft}
                        onBuy={(nft) => onNFTAction('buy', nft)}
                        onMakeOffer={(nft) => onNFTAction('offer', nft)}
                        onBid={(nft) => onNFTAction('bid', nft)}
                        onWatch={(nft) => onNFTAction('watch', nft)}
                        onFavorite={(nft) => onNFTAction('favorite', nft)}
                        variant="gallery"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">You haven't favorited any NFTs yet</p>
                    <Button 
                      onClick={() => onNFTAction('browse', {} as NFT)} 
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                    >
                      Browse Gallery
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Bids */}
          <TabsContent value="bids">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">My Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" className="space-y-4">
                  <TabsList className="bg-gray-800">
                    <TabsTrigger value="active">Active Bids</TabsTrigger>
                    <TabsTrigger value="won">Bids Won</TabsTrigger>
                    <TabsTrigger value="ended">Bids Lost/Ended</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    {mockBids.filter(bid => bid.status === 'active').map((bid) => (
                      <div key={bid.id} className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                        <img src={bid.nft.image} alt={bid.nft.title} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{bid.nft.title}</h3>
                          <p className="text-gray-400">Your bid: {bid.bidAmount} HBAR</p>
                          {bid.timeLeft && (
                            <p className="text-sm text-orange-400">
                              {bid.timeLeft > 1 ? `${Math.floor(bid.timeLeft)}h remaining` : `${Math.floor(bid.timeLeft * 60)}m remaining`}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-blue-600">Active</Badge>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="won">
                    <div className="text-center py-8">
                      <p className="text-gray-400">No bids won yet</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="ended">
                    <div className="text-center py-8">
                      <p className="text-gray-400">No ended bids</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Physical Art */}
          <TabsContent value="physical">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Physical Art Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPhysicalOrders.map((order) => (
                    <div key={order.id} className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                      <img src={order.nftImage} alt={order.nftTitle} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{order.nftTitle}</h3>
                        <p className="text-gray-400">Artist: {order.artist}</p>
                        <p className="text-sm text-gray-500">
                          Total: {order.price + order.shippingCost} HBAR (incl. shipping)
                        </p>
                        {order.contactDetails && (
                          <p className="text-sm text-gray-500">Contact: {order.contactDetails}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          <span className="mr-1">{getStatusIcon(order.status)}</span>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        {order.status === 'shipped' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Mark as Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {mockPhysicalOrders.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No physical art orders</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}