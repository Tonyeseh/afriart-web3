import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Search, Filter, X, Grid, List } from 'lucide-react';
import { NFTCard, NFT } from './NFTCard';
import { useDebounce } from '../hooks/useDebounce';

interface GalleryProps {
  nfts: NFT[];
  onNFTAction: (action: string, nft: NFT) => void;
}

const artTechniques = [
  'All',
  'Painting',
  'Drawing', 
  'Sculpture',
  'Printmaking',
  'Photography',
  'Film & Video Art',
  'Digital Art'
];

const artMaterials: Record<string, string[]> = {
  'Painting': ['oil paints', 'acrylics', 'watercolors', 'gouache', 'fresco', 'spray paint', 'digital painting tools'],
  'Drawing': ['graphite pencils', 'charcoal', 'ink pens', 'pastel (oil)', 'pastel (chalk)', 'crayons', 'digital drawing apps & tablets'],
  'Sculpture': ['stone', 'metal', 'wood', 'clay', 'plaster', 'resin', 'plastics', '3D printed materials', 'found objects'],
  'Printmaking': ['woodcut', 'engraving', 'etching', 'lithography', 'screen printing (silk screen + ink)', 'monotype'],
  'Photography': ['film cameras & negatives', 'darkroom paper & chemicals', 'digital cameras', 'editing software'],
  'Film & Video Art': ['analog film reels', 'digital video cameras', 'editing software', 'projection & installations'],
  'Digital Art': ['digital painting software', '3D modeling', 'AI-generated art', 'VR art tools', 'NFT platforms']
};

export function Gallery({ nfts, onNFTAction }: GalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedTechnique, setSelectedTechnique] = useState('All');
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [listingTypeFilter, setListingTypeFilter] = useState('all');
  const [physicalCopyFilter, setPhysicalCopyFilter] = useState('all');
  const [bring2LifeOnly, setBring2LifeOnly] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search term for better performance
  const debouncedSearch = useDebounce(searchTerm, 300);

  const availableMaterials = selectedTechnique === 'All' ? [] : artMaterials[selectedTechnique] || [];

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTechnique('All');
    setSelectedMaterial('All');
    setListingTypeFilter('all');
    setPhysicalCopyFilter('all');
    setPriceRange({ min: '', max: '' });
    setBring2LifeOnly(false);
    setSortBy('recent');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' ||
    selectedTechnique !== 'All' ||
    selectedMaterial !== 'All' ||
    listingTypeFilter !== 'all' ||
    physicalCopyFilter !== 'all' ||
    priceRange.min !== '' ||
    priceRange.max !== '' ||
    bring2LifeOnly;

  // Memoize filtered results for better performance
  const filteredNFTs = useMemo(() => {
    return nfts
    .filter(nft => {
      // Search filter (using debounced value)
      if (debouncedSearch && !nft.title.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
          !nft.creator.toLowerCase().includes(debouncedSearch.toLowerCase())) {
        return false;
      }

      // Price range filter
      const nftPrice = nft.currentBid || nft.price;
      if (priceRange.min !== '' && nftPrice < parseFloat(priceRange.min)) {
        return false;
      }
      if (priceRange.max !== '' && nftPrice > parseFloat(priceRange.max)) {
        return false;
      }

      // Listing Type filter
      if (listingTypeFilter !== 'all') {
        if (listingTypeFilter === 'auction' && nft.listingType !== 'auction') {
          return false;
        }
        if (listingTypeFilter === 'buy' && nft.listingType !== 'sale') {
          return false;
        }
      }

      // Physical Copy filter
      if (physicalCopyFilter !== 'all') {
        if (physicalCopyFilter === 'available' && !nft.physicalCopy) {
          return false;
        }
        if (physicalCopyFilter === 'unavailable' && nft.physicalCopy) {
          return false;
        }
      }

      // Technique filter
      if (selectedTechnique !== 'All' && nft.technique !== selectedTechnique) {
        return false;
      }

      // Material filter (mock implementation)
      if (selectedMaterial !== 'All') {
        // In real app, this would check NFT material property
        return true;
      }

      // Bring2Life filter (mock - would filter actual Bring2Life requests)
      if (bring2LifeOnly) {
        // For demo, showing subset of NFTs when toggled
        return nft.id.includes('1') || nft.id.includes('3');
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        case 'ending-soon':
          // Sort auctions by time left (ascending), non-auctions go to end
          if (a.listingType === 'auction' && b.listingType === 'auction') {
            const aTimeLeft = a.timeLeft || Infinity;
            const bTimeLeft = b.timeLeft || Infinity;
            return aTimeLeft - bTimeLeft;
          } else if (a.listingType === 'auction') {
            return -1; // a comes first
          } else if (b.listingType === 'auction') {
            return 1; // b comes first
          }
          return 0; // both non-auctions, maintain order
        case 'bids-fewest':
          // Sort by bid count (ascending), non-auctions go to end
          if (a.listingType === 'auction' && b.listingType === 'auction') {
            const aBids = a.bidCount || 0;
            const bBids = b.bidCount || 0;
            return aBids - bBids;
          } else if (a.listingType === 'auction') {
            return -1; // a comes first
          } else if (b.listingType === 'auction') {
            return 1; // b comes first
          }
          return 0; // both non-auctions, maintain order
        case 'bids-most':
          // Sort by bid count (descending), non-auctions go to end
          if (a.listingType === 'auction' && b.listingType === 'auction') {
            const aBids = a.bidCount || 0;
            const bBids = b.bidCount || 0;
            return bBids - aBids;
          } else if (a.listingType === 'auction') {
            return -1; // a comes first
          } else if (b.listingType === 'auction') {
            return 1; // b comes first
          }
          return 0; // both non-auctions, maintain order
        case 'recent':
        default:
          return 0; // Mock - would sort by creation date
      }
    });
  }, [nfts, debouncedSearch, selectedTechnique, selectedMaterial, listingTypeFilter, physicalCopyFilter, sortBy, priceRange, bring2LifeOnly]);

  const displayedNFTs = showMore ? filteredNFTs : filteredNFTs.slice(0, 12);

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">AfriArt Collection</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover unique digital art from talented African artists
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search by art title or artist name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800 text-white placeholder-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="space-y-6 mb-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          {/* Listing Type Tabs */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-400">Listing Type</Label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Auction', 'Buy It Now'].map((type) => (
                <button
                  key={type}
                  onClick={() => setListingTypeFilter(type === 'All' ? 'all' : type === 'Auction' ? 'auction' : 'buy')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    listingTypeFilter === (type === 'All' ? 'all' : type === 'Auction' ? 'auction' : 'buy') 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort By */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="price-high">Price High - Low</SelectItem>
                  <SelectItem value="price-low">Price Low - High</SelectItem>
                  <SelectItem value="ending-soon">Ending Soon</SelectItem>
                  <SelectItem value="bids-fewest">Number of Bids - Fewest First</SelectItem>
                  <SelectItem value="bids-most">Number of Bids - Most First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Art Technique */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Art Technique</Label>
              <Select value={selectedTechnique} onValueChange={(value) => {
                setSelectedTechnique(value);
                setSelectedMaterial('All'); // Reset material when technique changes
              }}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {artTechniques.map(technique => (
                    <SelectItem key={technique} value={technique}>{technique}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Art Material */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Art Material</Label>
              <Select 
                value={selectedMaterial} 
                onValueChange={setSelectedMaterial}
                disabled={selectedTechnique === 'All'}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="All">All Materials</SelectItem>
                  {availableMaterials.map(material => (
                    <SelectItem key={material} value={material}>{material}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Physical Copy Availability */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Physical Copy</Label>
              <Select value={physicalCopyFilter} onValueChange={setPhysicalCopyFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Has Physical Copy</SelectItem>
                  <SelectItem value="unavailable">No Physical Copy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Price Range (HBAR)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="0"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Bring2Life Toggle & Reset Button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="bring2life"
                checked={bring2LifeOnly}
                onCheckedChange={setBring2LifeOnly}
              />
              <Label htmlFor="bring2life" className="text-sm text-white cursor-pointer">
                Bring2Life Request Only
              </Label>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <X className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* View Mode Toggle & Results Count */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-gray-400">
            {filteredNFTs.length} {filteredNFTs.length === 1 ? 'artwork' : 'artworks'} found
          </p>

          {/* Grid/List View Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Filter Pills (if needed below results count) */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Active Filter Pills */}
            {listingTypeFilter !== 'all' && (
              <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                {listingTypeFilter === 'auction' ? 'Auctions Only' : 'Buy It Now Only'}
              </span>
            )}
            {physicalCopyFilter !== 'all' && (
              <span className="px-2 py-1 bg-pink-600/20 text-pink-400 text-xs rounded-full">
                {physicalCopyFilter === 'available' ? 'Physical Copy Available' : 'Digital Only'}
              </span>
            )}
            {selectedTechnique !== 'All' && (
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                {selectedTechnique}
              </span>
            )}
            {bring2LifeOnly && (
              <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                Bring2Life Requests
              </span>
            )}
            {(sortBy !== 'recent' && (sortBy === 'ending-soon' || sortBy === 'bids-fewest' || sortBy === 'bids-most')) && (
              <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full">
                {sortBy === 'ending-soon' ? 'Ending Soon' : sortBy === 'bids-fewest' ? 'Fewest Bids' : 'Most Bids'}
              </span>
            )}
          </div>
        </div>

        {/* NFT Grid */}
        {displayedNFTs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {displayedNFTs.map((nft) => (
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

            {/* View More Button */}
            {filteredNFTs.length > 12 && !showMore && (
              <div className="text-center">
                <Button 
                  onClick={() => setShowMore(true)}
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                >
                  View More ({filteredNFTs.length - 12} remaining)
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Filter className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No artworks found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}