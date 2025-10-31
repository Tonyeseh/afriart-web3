import { z } from 'zod';

// File size constants
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

// Art techniques and materials
export const artTechniques = [
  'Painting',
  'Drawing',
  'Sculpture',
  'Printmaking',
  'Photography',
  'Film & Video Art',
  'Digital Art',
] as const;

export const artMaterials: Record<string, string[]> = {
  'Painting': ['oil paints', 'acrylics', 'watercolors', 'gouache', 'fresco', 'spray paint', 'digital painting tools'],
  'Drawing': ['graphite pencils', 'charcoal', 'ink pens', 'pastel (oil)', 'pastel (chalk)', 'crayons', 'digital drawing apps & tablets'],
  'Sculpture': ['stone', 'metal', 'wood', 'clay', 'plaster', 'resin', 'plastics', '3D printed materials', 'found objects'],
  'Printmaking': ['woodcut', 'engraving', 'etching', 'lithography', 'screen printing (silk screen + ink)', 'monotype'],
  'Photography': ['film cameras & negatives', 'darkroom paper & chemicals', 'digital cameras', 'editing software'],
  'Film & Video Art': ['analog film reels', 'digital video cameras', 'editing software', 'projection & installations'],
  'Digital Art': ['digital painting software', '3D modeling', 'AI-generated art', 'VR art tools', 'NFT platforms'],
};

// Custom file validation
const fileSchema = z
  .custom<File>((val) => val instanceof File, { message: 'Please upload a file' })
  .refine((file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
    return validTypes.includes(file.type);
  }, { message: 'Only JPG, PNG, or MP4 files are allowed' })
  .refine((file) => {
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    return file.size <= maxSize;
  }, { message: 'File size must be less than 50MB for images or 200MB for videos' });

// Listing type enum
export const listingTypeEnum = z.enum(['sale', 'auction']);

// Auction duration enum
export const auctionDurationEnum = z.enum(['6', '12', '24', '48', '72', '168']);

// Main NFT creation schema
export const createNFTSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters'),

  technique: z
    .enum(artTechniques, {
      errorMap: () => ({ message: 'Please select a valid art technique' }),
    }),

  material: z
    .string()
    .min(1, 'Please select a material'),

  physicalCopy: z.boolean().default(false),

  listingType: listingTypeEnum.default('sale'),

  price: z
    .string()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(parseFloat(val)), 'Price must be a valid number')
    .refine((val) => parseFloat(val) > 0, 'Price must be greater than 0')
    .refine((val) => parseFloat(val) <= 1000000, 'Price must not exceed 1,000,000 HBAR'),

  auctionDuration: auctionDurationEnum.default('24'),

  file: fileSchema,
});

// Type inference for the form
export type CreateNFTFormData = z.infer<typeof createNFTSchema>;
