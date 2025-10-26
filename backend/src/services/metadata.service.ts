import { HIP412Metadata } from "../types";

export class MetadataService {
     /**
   * Generate HIP-412 compliant NFT metadata
   * Spec: https://hips.hedera.com/hip/hip-412
   */
  generateHIP412Metadata(params: {
    name: string;
    description: string;
    creator: string;
    creatorDID?: string;
    imageUrl: string;
    imageCid: string;
    technique?: string;
    material?: string;
    dimensions?: string;
    yearCreated?: string;
    country?: string;
  }): HIP412Metadata {
    return {
      name: params.name,
      creator: params.creator,
      creatorDID: params.creatorDID,
      description: params.description,
      image: params.imageUrl,  // IPFS gateway URL
      type: 'image',
      format: 'image/png',  // or image/jpeg
      properties: {
        technique: params.technique,
        material: params.material,
        dimensions: params.dimensions,
        yearCreated: params.yearCreated,
        country: params.country || 'Africa',
      },
      files: [
        {
          uri: params.imageUrl,
          type: 'image',
          metadata: {
            cid: params.imageCid,
          },
        },
      ],
      attributes: [
        {
          trait_type: 'Technique',
          value: params.technique || 'Digital',
        },
        {
          trait_type: 'Material',
          value: params.material || 'Digital',
        },
      ],
    };
  }
}

export const metadataService = new MetadataService();