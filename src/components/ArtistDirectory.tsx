import { useState } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, User, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface Artist {
  id: string;
  displayName: string;
  walletAddress: string;
  profilePicture: string;
  bio: string;
  nftCount: number;
  totalSales: number;
  primaryTechnique: string;
  isVerified: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

interface ArtistDirectoryProps {
  onViewArtist: (artist: Artist) => void;
}

const mockArtists: Artist[] = [
  {
    id: '1',
    displayName: 'Amara Okafor',
    walletAddress: '0.0.123456',
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
    bio: 'Contemporary artist exploring African heritage through digital mediums. Specializing in vibrant landscapes and cultural portraits.',
    nftCount: 24,
    totalSales: 15000,
    primaryTechnique: 'Digital Art',
    isVerified: true,
    socialLinks: {
      twitter: '@amaraokafor',
      instagram: '@amara_art',
      website: 'https://amaraokafor.art'
    }
  },
  {
    id: '2',
    displayName: 'Kwame Asante',
    walletAddress: '0.0.789012',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Traditional sculptor transitioning to NFTs. Known for abstract forms inspired by Akan symbols and stories.',
    nftCount: 18,
    totalSales: 12500,
    primaryTechnique: 'Sculpture',
    isVerified: true,
    socialLinks: {
      twitter: '@kwameasante',
      website: 'https://kwameasante.com'
    }
  },
  {
    id: '3',
    displayName: 'Zara Mthembu',
    walletAddress: '0.0.345678',
    profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
    bio: 'Photography artist capturing the beauty of African landscapes and wildlife. Passionate about conservation through art.',
    nftCount: 32,
    totalSales: 20000,
    primaryTechnique: 'Photography',
    isVerified: false,
    socialLinks: {
      instagram: '@zara_wildlife',
      website: 'https://zaraphotography.co.za'
    }
  },
  {
    id: '4',
    displayName: 'Olumide Adebayo',
    walletAddress: '0.0.901234',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Abstract painter exploring color theory and emotion. My work celebrates the vibrancy of African culture and diaspora.',
    nftCount: 16,
    totalSales: 8500,
    primaryTechnique: 'Painting',
    isVerified: true,
    socialLinks: {
      twitter: '@olumideart',
      instagram: '@olumide_paintings'
    }
  },
  {
    id: '5',
    displayName: 'Fatima Al-Hassan',
    walletAddress: '0.0.567890',
    profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Mixed media artist combining traditional textiles with digital art. Exploring themes of identity and belonging.',
    nftCount: 22,
    totalSales: 11200,
    primaryTechnique: 'Digital Art',
    isVerified: false,
    socialLinks: {
      instagram: '@fatima_mixed_media',
      website: 'https://fatimaart.net'
    }
  },
  {
    id: '6',
    displayName: 'Themba Nkomo',
    walletAddress: '0.0.432109',
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Street artist and muralist bringing urban African art to the blockchain. Known for bold geometric patterns.',
    nftCount: 14,
    totalSales: 6800,
    primaryTechnique: 'Digital Art',
    isVerified: true,
    socialLinks: {
      twitter: '@themba_street',
      instagram: '@themba_murals'
    }
  }
];

const artTechniques = ['All', 'Digital Art', 'Painting', 'Photography', 'Sculpture', 'Drawing', 'Mixed Media'];

export function ArtistDirectory({ onViewArtist }: ArtistDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  const filteredArtists = mockArtists
    .filter(artist => {
      // Search filter
      if (searchTerm && !artist.displayName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Technique filter
      if (selectedTechnique !== 'All' && artist.primaryTechnique !== selectedTechnique) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sales':
          return b.totalSales - a.totalSales;
        case 'nfts':
          return b.nftCount - a.nftCount;
        case 'name':
        default:
          return a.displayName.localeCompare(b.displayName);
      }
    });

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">African Artists</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover talented artists from across the African continent creating amazing NFTs
          </p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search artists by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder-gray-400"
            />
          </div>

          {/* Technique Filter */}
          <Select value={selectedTechnique} onValueChange={setSelectedTechnique}>
            <SelectTrigger className="bg-gray-900 border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {artTechniques.map(technique => (
                <SelectItem key={technique} value={technique}>{technique}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-gray-900 border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="sales">Sort by Sales</SelectItem>
              <SelectItem value="nfts">Sort by NFT Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            {filteredArtists.length} {filteredArtists.length === 1 ? 'artist' : 'artists'} found
          </p>
        </div>

        {/* Artists Grid */}
        {filteredArtists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => (
              <Card key={artist.id} className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={artist.profilePicture} />
                      <AvatarFallback>{artist.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-semibold truncate">{artist.displayName}</h3>
                        {artist.isVerified && (
                          <Badge className="bg-blue-600 text-white text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{truncateAddress(artist.walletAddress)}</p>
                      <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 text-xs mt-1">
                        {artist.primaryTechnique}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {artist.bio}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-white font-semibold">{artist.nftCount}</div>
                      <div className="text-gray-400 text-xs">NFTs Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{artist.totalSales.toLocaleString()}</div>
                      <div className="text-gray-400 text-xs">HBAR in Sales</div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {artist.socialLinks && (
                    <div className="flex justify-center space-x-3 mb-4">
                      {artist.socialLinks.twitter && (
                        <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                      )}
                      {artist.socialLinks.instagram && (
                        <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.324-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.324C5.901 8.247 7.052 7.757 8.349 7.757s2.448.49 3.324 1.297c.876.876 1.366 2.027 1.366 3.324s-.49 2.448-1.366 3.324c-.876.876-2.027 1.366-3.324 1.366zm7.718 0c-1.297 0-2.448-.49-3.324-1.297-.876-.876-1.366-2.027-1.366-3.324s.49-2.448 1.366-3.324c.876-.876 2.027-1.366 3.324-1.366s2.448.49 3.324 1.366c.876.876 1.366 2.027 1.366 3.324s-.49 2.448-1.366 3.324c-.876.876-2.027 1.366-3.324 1.366z"/>
                          </svg>
                        </a>
                      )}
                      {artist.socialLinks.website && (
                        <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* View Profile Button */}
                  <Button 
                    onClick={() => onViewArtist(artist)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No artists found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}