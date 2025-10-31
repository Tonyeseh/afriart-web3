import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  Wallet,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';
import {
  createNFTSchema,
  artTechniques,
  artMaterials,
} from '../schemas/nft.schema';
import { z } from 'zod';

// Infer the form type from the schema
type CreateNFTFormData = z.infer<typeof createNFTSchema>;

interface CreateNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess: (nft: any) => void;
}

type ModalState = 'form' | 'minting' | 'success';

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

  const [dragActive, setDragActive] = useState(false);
  const [mintedNFT, setMintedNFT] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mintingStep, setMintingStep] = useState<'uploading' | 'creating' | 'finalizing'>('uploading');
  const [apiError, setApiError] = useState<string>('');

  const hbarToUsd = 0.25; // Mock conversion rate

  // Initialize react-hook-form with Zod validation
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<CreateNFTFormData>({
    resolver: zodResolver(createNFTSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      technique: undefined,
      material: '',
      physicalCopy: false,
      listingType: 'sale',
      price: '',
      auctionDuration: '24',
      file: undefined,
    }
  });

  const watchedTechnique = watch('technique');
  const watchedFile = watch('file');
  const watchedListingType = watch('listingType');
  const watchedPrice = watch('price');

  const usdPrice = parseFloat(watchedPrice) * hbarToUsd || 0;

  // Reset material when technique changes
  useEffect(() => {
    if (watchedTechnique) {
      setValue('material', '', { shouldValidate: true });
    }
  }, [watchedTechnique, setValue]);

  // Memory leak fix: Clean up object URLs
  useEffect(() => {
    return () => {
      if (watchedFile) {
        URL.revokeObjectURL(URL.createObjectURL(watchedFile));
      }
    };
  }, [watchedFile]);

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
    const isVideo = file.type.startsWith('video/');

    // Check video duration for videos
    if (isVideo) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > MAX_VIDEO_DURATION) {
          setApiError('Video duration must be less than 5 minutes');
          return;
        }
      } catch (error) {
        console.error('Error checking video duration:', error);
        setApiError('Failed to validate video. Please try another file.');
        return;
      }
    }

    setValue('file', file, { shouldValidate: true });
    setApiError('');
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

  const onSubmit = async (data: CreateNFTFormData) => {
    console.log('Form submitted with data:', data);
    setApiError('');
    setCurrentState('minting');
    setUploadProgress(0);
    setMintingStep('uploading');

    try {
      // Get JWT token from localStorage with correct key
      const token = localStorage.getItem('afriart_auth_token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      setMintingStep('creating');
      setUploadProgress(30);

      // Prepare form data for backend
      const mintFormData = new FormData();
      mintFormData.append('title', data.title);
      mintFormData.append('description', data.description);
      mintFormData.append('image', data.file);
      mintFormData.append('technique', data.technique);
      mintFormData.append('material', data.material);

      setUploadProgress(50);

      // Call the minting endpoint
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/nfts/mint`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: mintFormData,
      });

      setUploadProgress(80);

      // Parse response
      const result = await response.json();

      // Handle error responses
      if (!response.ok) {
        const errorMessage = result.error || result.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to mint NFT');
      }

      // Finalize
      setMintingStep('finalizing');
      setUploadProgress(95);

      const { nft, transaction } = result.data;

      const newNFT = {
        id: nft.id,
        tokenId: nft.token_id,
        serialNumber: nft.serial_number,
        title: nft.title,
        description: nft.description,
        technique: nft.art_technique,
        material: nft.art_material,
        price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
        usdPrice: (typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0) * hbarToUsd,
        physicalCopy: data.physicalCopy,
        image: nft.image_url,
        ipfsHash: nft.image_ipfs_cid,
        metadataUrl: nft.metadata_url,
        metadataCid: nft.metadata_ipfs_cid,
        creator: walletAddress,
        owner: walletAddress,
        listingType: data.listingType,
        auctionDuration: data.listingType === 'auction' ? parseInt(data.auctionDuration || '24') : undefined,
        auctionEndTime: data.listingType === 'auction'
          ? new Date(Date.now() + parseInt(data.auctionDuration || '24') * 60 * 60 * 1000)
          : undefined,
        hederaTransactionId: transaction.transactionId,
        mintedAt: nft.minted_at,
      };

      setUploadProgress(100);
      setMintedNFT(newNFT);
      setCurrentState('success');
    } catch (error: any) {
      console.error('Error minting NFT:', error);

      // Properly extract error message
      let errorMessage = 'Failed to mint NFT. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      }

      setApiError(errorMessage);
      setCurrentState('form');
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    reset();
    setCurrentState('form');
    setMintedNFT(null);
    setApiError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const renderFilePreview = () => {
    if (!watchedFile) return null;

    const isVideo = watchedFile.type.startsWith('video/');
    const fileUrl = URL.createObjectURL(watchedFile);

    return (
      <div className="relative">
        {isVideo ? (
          <video src={fileUrl} className="w-full h-40 object-cover rounded-lg" controls />
        ) : (
          <img src={fileUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
        )}
        <button
          type="button"
          onClick={() => setValue('file', undefined as any, { shouldValidate: true })}
          className="absolute top-2 right-2 p-1 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  };

  const renderFormState = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Wallet Address Display */}
      <div className="flex items-center justify-end text-sm text-gray-400">
        <Wallet className="h-4 w-4 mr-2" />
        <span>Connected: {walletAddress}</span>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">{apiError}</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="title">Title *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button">
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
          {...register('title')}
          placeholder="Enter artwork title"
          className="bg-gray-800 border-gray-700"
        />
        {errors.title && (
          <p className="text-sm text-red-400">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="description">Description *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button">
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
          {...register('description')}
          placeholder="Describe your artwork, inspiration, and creative process..."
          rows={3}
          className="bg-gray-800 border-gray-700"
        />
        {errors.description && (
          <p className="text-sm text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Technique and Material */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label>Technique *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger type="button">
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltips.technique}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Controller
            name="technique"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select technique" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {artTechniques.map(technique => (
                    <SelectItem key={technique} value={technique}>{technique}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.technique && (
            <p className="text-sm text-red-400">{errors.technique.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label>Material *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger type="button">
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltips.material}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Controller
            name="material"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!watchedTechnique}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {(artMaterials[watchedTechnique || ''] || []).map(material => (
                    <SelectItem key={material} value={material}>{material}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.material && (
            <p className="text-sm text-red-400">{errors.material.message}</p>
          )}
        </div>
      </div>

      {/* Physical Copy Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <Label htmlFor="physical-copy">Physical Copy Available</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button">
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltips.physicalCopy}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Controller
          name="physicalCopy"
          control={control}
          render={({ field }) => (
            <Switch
              id="physical-copy"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Listing Type Selection */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label>Listing Type *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button">
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltips.listingType}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Controller
          name="listingType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => field.onChange('sale')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  field.value === 'sale'
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
                onClick={() => field.onChange('auction')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  field.value === 'auction'
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
          )}
        />
      </div>

      {/* Price / Starting Bid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="price">
              {watchedListingType === 'auction' ? 'Starting Bid (HBAR) *' : 'Price (HBAR) *'}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger type="button">
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
            {...register('price')}
            placeholder="0.00"
            className="bg-gray-800 border-gray-700"
          />
          {errors.price && (
            <p className="text-sm text-red-400">{errors.price.message}</p>
          )}
          {watchedPrice && !errors.price && (
            <p className="text-sm text-green-400">
              ≈ ${usdPrice.toFixed(2)} USD
            </p>
          )}
        </div>

        {/* Auction Duration (only for auctions) */}
        {watchedListingType === 'auction' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label>Auction Duration *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger type="button">
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{tooltips.auctionDuration}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Controller
              name="auctionDuration"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label>Upload Artwork *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button">
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltips.upload}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {watchedFile ? (
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
                JPG, PNG, or MP4 • Max size: 50MB (images), 200MB (videos)
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
        {errors.file && (
          <p className="text-sm text-red-400">{errors.file.message as string}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Mint NFT
        </Button>
      </div>
    </form>
  );

  const renderMintingState = () => {
    const getStepMessage = () => {
      switch (mintingStep) {
        case 'uploading':
          return 'Uploading artwork to IPFS...';
        case 'creating':
          return 'Creating NFT on Hedera blockchain...';
        case 'finalizing':
          return 'Finalizing NFT creation...';
        default:
          return 'Processing...';
      }
    };

    const getProgressValue = () => {
      if (mintingStep === 'uploading') {
        return uploadProgress * 0.5;
      } else if (mintingStep === 'creating') {
        return 50 + 25;
      } else if (mintingStep === 'finalizing') {
        return 50 + 25 + 20;
      }
      return 0;
    };

    return (
      <div className="text-center space-y-6 py-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-purple-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Minting Your NFT...</h3>
            <p className="text-gray-400">
              {getStepMessage()}
            </p>
            {mintingStep === 'uploading' && uploadProgress > 0 && (
              <p className="text-sm text-purple-400 mt-2">
                Upload Progress: {uploadProgress}%
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={getProgressValue()} className="w-full max-w-md mx-auto" />
          <div className="flex justify-between text-xs text-gray-500 max-w-md mx-auto px-2">
            <span className={mintingStep === 'uploading' ? 'text-purple-400 font-semibold' : ''}>
              Upload
            </span>
            <span className={mintingStep === 'creating' ? 'text-purple-400 font-semibold' : ''}>
              Create
            </span>
            <span className={mintingStep === 'finalizing' ? 'text-purple-400 font-semibold' : ''}>
              Finalize
            </span>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-xs text-gray-500 mb-4">
            Please don't close this window while your NFT is being created.
          </p>
        </div>
      </div>
    );
  };

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
