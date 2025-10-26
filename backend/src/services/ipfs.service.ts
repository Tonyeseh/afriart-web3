import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../config/logger';

export class IPFSService {
  private readonly pinataApiKey: string;
  private readonly pinataSecretKey: string;
  private readonly gatewayUrl = 'https://gateway.pinata.cloud/ipfs/';

  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY!;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY!;
  }

  /**
   * Upload file to IPFS via Pinata
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: { name: string }
  ): Promise<{ cid: string; url: string; size: number }> {
    const formData = new FormData();
    formData.append('file', fileBuffer, options.name);

    const metadata = JSON.stringify({
      name: options.name,
    });
    formData.append('pinataMetadata', metadata);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretKey,
        },
      }
    );

    const cid = response.data.IpfsHash;

    return {
      cid,
      url: `${this.gatewayUrl}${cid}`,
      size: response.data.PinSize,
    };
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(
    data: any,
    options: { name: string }
  ): Promise<{ cid: string; url: string }> {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: data,
        pinataMetadata: {
          name: options.name,
        },
      },
      {
        headers: {
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretKey,
        },
      }
    );

    const cid = response.data.IpfsHash;

    return {
      cid,
      url: `${this.gatewayUrl}${cid}`,
    };
  }
}

export const ipfsService = new IPFSService();
