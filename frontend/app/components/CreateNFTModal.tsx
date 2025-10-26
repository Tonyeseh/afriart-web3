import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Upload, 
  X, 
  Loader2, 
  CheckCircle, 
  Info, 
  Image as ImageIcon, 
  Video,
  Wallet,
  Sparkles
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';

interface CreateNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess: (nft: any) => void;
}

type ModalState = 'form' | 'minting' | 'success';

const artTechniques = [
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

// File size constants
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_VIDEO_DURATION = 300; // 5 minutes in seconds

const tooltips = {
  title: "Enter a unique and descriptive title for your artwork (3-100 characters)",
  description: "Provide details about your artwork, inspiration, and artistic process (minimum 20 characters)",
  technique: "Select the primary artistic technique used to create this work",
  material: "Choose the specific materials or tools used in your artwork",
  physicalCopy: "Toggle if you're willing to create and ship a physical version",
  price: "Set your price in HBAR (Hedera's native cryptocurrency)",
  listingType: "Choose to sell at a fixed price or auction your artwork",
  auctionDuration: "Set how long the auction will run",
  upload: "Upload your artwork file. Supports JPG, PNG, MP4. Max: 50MB (images), 200MB (videos, max 5 min)"
};

export function CreateNFTModal({ isOpen, onClose, walletAddress, onSuccess }: CreateNFTModalProps) {
  const [currentState, setCurrentState] = useState<ModalState>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technique: '',
    material: '',
    physicalCopy: false,
    listingType: 'sale' as 'sale' | 'auction',
    price: '',
    auctionDuration: '24',
    file: null as File | null
  });

  const [dragActive, setDragActive] = useState(false);
  const [mintedNFT, setMintedNFT] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const hbarToUsd = 0.25; // Mock conversion rate
  const usdPrice = parseFloat(formData.price) * hbarToUsd || 0;

  // Memory leak fix: Clean up object URLs
  useEffect(() => {
    return () => {
      if (formData.file) {
        URL.revokeObjectURL(URL.createObjectURL(formData.file));
      }
    };
  }, [formData.file]);

  // Enhanced form validation
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (formData.title.length < 3) {
      errors.push('Title must be at least 3 characters');
    }
    if (formData.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }
    if (formData.description.length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    if (formData.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }
    if (!formData.technique) {
      errors.push('Please select an art technique');
    }
    if (!formData.material) {
      errors.push('Please select a material');
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      errors.push('Please enter a valid price');
    } else if (price <= 0) {
      errors.push('Price must be greater than 0');
    } else if (price > 1000000) {
      errors.push('Price seems unreasonably high (max: 1,000,000 HBAR)');
    }

    if (!formData.file) {
      errors.push('Please upload an artwork file');
    }

    return errors;
  };

  const isFormValid = () => {
    return validateForm().length === 0;
  };

  // Get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload JPG, PNG, or MP4 files only');
      return;
    }

    // Validate file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB for ${isVideo ? 'videos' : 'images'}`);
      return;
    }

    // Check video duration for videos
    if (isVideo) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > MAX_VIDEO_DURATION) {
          alert('Video duration must be less than 5 minutes');
          return;
        }
      } catch (error) {
        console.error('Error checking video duration:', error);
        alert('Failed to validate video. Please try another file.');
        return;
      }
    }

    setFormData(prev => ({ ...prev, file }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleMintNFT = async () => {
    // Validate form before minting
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setCurrentState('minting');

    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 3000));

    const newNFT = {
      id: `nft_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      technique: formData.technique,
      material: formData.material,
      price: parseFloat(formData.price),
      usdPrice: usdPrice,
      physicalCopy: formData.physicalCopy,
      image: formData.file ? URL.createObjectURL(formData.file) : '',
      tokenId: `0.0.${Math.floor(Math.random() * 900000) + 100000}`,
      creator: walletAddress,
      owner: walletAddress,
      listingType: formData.listingType,
      auctionDuration: formData.listingType === 'auction' ? parseInt(formData.auctionDuration) : undefined,
      auctionEndTime: formData.listingType === 'auction'
        ? new Date(Date.now() + parseInt(formData.auctionDuration) * 60 * 60 * 1000)
        : undefined
    };

    setMintedNFT(newNFT);
    setCurrentState('success');
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      technique: '',
      material: '',
      physicalCopy: false,
      listingType: 'sale',
      price: '',
      auctionDuration: '24',
      file: null
    });
    setCurrentState('form');
    setMintedNFT(null);
    setValidationErrors([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const renderFilePreview = () => {
    if (!formData.file) return null;

    const isVideo = formData.file.type.startsWith('video/');
    const fileUrl = URL.createObjectURL(formData.file);

    return (
      <div className="relative">
        {isVideo ? (
          <video src={fileUrl} className="w-full h-40 object-cover rounded-lg" controls />
        ) : (
          <img src={fileUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
        )}
        <button
          onClick={() => setFormData(prev => ({ ...prev, file: null }))}
          className="absolute top-2 right-2 p-1 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  };

  const renderFormState = () => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Wallet Address Display */}
      <div className="flex items-center justify-end text-sm text-gray-400">
        <Wallet className="h-4 w-4 mr-2" />
        <span>Connected: {walletAddress}</span>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400 mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-300">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="title">Title *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltips.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter artwork title"
          className="bg-gray-800 border-gray-700"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="description">Description *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltips.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your artwork, inspiration, and creative process..."
          rows={3}
          className="bg-gray-800 border-gray-700"
        />
      </div>

      {/* Technique and Material */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label>Technique *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltips.technique}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={formData.technique} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, technique: value, material: '' }))
          }>
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select technique" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {artTechniques.map(technique => (
                <SelectItem key={technique} value={technique}>{technique}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label>Material *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltips.material}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select 
            value={formData.material} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, material: value }))}
            disabled={!formData.technique}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {(artMaterials[formData.technique] || []).map(material => (
                <SelectItem key={material} value={material}>{material}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Physical Copy Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <Label htmlFor="physical-copy">Physical Copy Available</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltips.physicalCopy}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="physical-copy"
          checked={formData.physicalCopy}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, physicalCopy: checked }))}
        />
      </div>

      {/* Listing Type Selection */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label>Listing Type *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltips.listingType}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, listingType: 'sale' }))}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.listingType === 'sale'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <p className="font-semibold text-white mb-1">Fixed Price</p>
              <p className="text-xs text-gray-400">Sell at a set price</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, listingType: 'auction' }))}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.listingType === 'auction'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <p className="font-semibold text-white mb-1">Auction</p>
              <p className="text-xs text-gray-400">Accept bids</p>
            </div>
          </button>
        </div>
      </div>

      {/* Price / Starting Bid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="price">
              {formData.listingType === 'auction' ? 'Starting Bid (HBAR) *' : 'Price (HBAR) *'}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltips.price}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="0.00"
            className="bg-gray-800 border-gray-700"
          />
          {formData.price && (
            <p className="text-sm text-green-400">
              ≈ ${usdPrice.toFixed(2)} USD
            </p>
          )}
        </div>

        {/* Auction Duration (only for auctions) */}
        {formData.listingType === 'auction' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label>Auction Duration *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{tooltips.auctionDuration}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={formData.auctionDuration}
              onValueChange={(value) => setFormData(prev => ({ ...prev, auctionDuration: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">2 days</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label>Upload Artwork *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltips.upload}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {formData.file ? (
          renderFilePreview()
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                {dragActive ? (
                  <Upload className="h-12 w-12 text-purple-400" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-white mb-2">
                  {dragActive ? 'Drop your file here' : 'Drag and drop your artwork here'}
                </p>
                <p className="text-sm text-gray-400 mb-4">or</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                >
                  Choose File
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                JPG, PNG, or MP4 • Max size: 20MB
              </p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.mp4"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleMintNFT}
          disabled={!isFormValid()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mint NFT
        </Button>
      </div>
    </div>
  );

  const renderMintingState = () => (
    <div className="text-center space-y-6 py-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <Loader2 className="h-16 w-16 text-purple-400 animate-spin" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Minting Your NFT...</h3>
          <p className="text-gray-400">
            Please confirm the transaction in your wallet. This may take a few seconds.
          </p>
        </div>
      </div>
      
      <Progress value={66} className="w-full max-w-md mx-auto" />
      
      <div className="pt-4">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center space-y-6 py-4">
      {/* Celebratory Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative"
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <CheckCircle className="h-20 w-20 text-green-400" />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-green-400/20"
            />
          </div>
        </div>
        
        {/* Confetti-like sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              y: [-20, -60, -100],
              x: [0, (i % 2 === 0 ? 30 : -30) * (i + 1), 0]
            }}
            transition={{ 
              duration: 1.5,
              delay: i * 0.1,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="absolute top-1/2 left-1/2"
          >
            <Sparkles className="h-4 w-4 text-purple-400" style={{ 
              transform: `rotate(${i * 60}deg)` 
            }} />
          </motion.div>
        ))}
      </motion.div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">NFT Minted Successfully!</h3>
        <p className="text-gray-400">Your artwork is now live on the blockchain</p>
      </div>

      {/* NFT Preview Card */}
      {mintedNFT && (
        <Card className="max-w-sm mx-auto bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="space-y-3">
              <ImageWithFallback
                src={mintedNFT.image}
                alt={mintedNFT.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="space-y-2">
                <h4 className="text-white font-semibold">{mintedNFT.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400">Token ID:</span>
                  <Badge variant="secondary" className="bg-purple-600/20 text-purple-400">
                    #{mintedNFT.tokenId}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white">{mintedNFT.price} HBAR</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button 
          onClick={() => {
            onSuccess(mintedNFT);
            handleClose();
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          View in My Creations
        </Button>
        <Button 
          variant="outline"
          onClick={handleReset}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Mint Another NFT
        </Button>
      </div>
    </div>
  );

  const getModalTitle = () => {
    switch (currentState) {
      case 'form': return 'Add New Art';
      case 'minting': return 'Minting NFT';
      case 'success': return 'Success!';
      default: return 'Add New Art';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{getModalTitle()}</DialogTitle>
        </DialogHeader>

        {currentState === 'form' && renderFormState()}
        {currentState === 'minting' && renderMintingState()}
        {currentState === 'success' && renderSuccessState()}
      </DialogContent>
    </Dialog>
  );
}