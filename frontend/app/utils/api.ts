import { projectId, publicAnonKey } from './supabase/info';

// Use environment variable for backend URL or default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('afriart_auth_token');
}

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}, useAuthToken: boolean = false) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add auth token if requested and available
  if (useAuthToken) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Auth API functions
export const authAPI = {
  async getAuthMessage(walletAddress: string) {
    return apiRequest(`/auth/message?walletAddress=${encodeURIComponent(walletAddress)}`);
  },

  async verifySignature(data: {
    walletAddress: string;
    message: string;
    signature: string;
    publicKey: string;
  }) {
    return apiRequest('/auth/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async register(userData: {
    walletAddress: string;
    role: 'buyer' | 'artist' | 'admin';
    displayName?: string;
    email?: string;
    bio?: string;
    profilePictureUrl?: string;
    socialLinks?: Record<string, string>;
  }) {
    return apiRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async logout(token: string) {
    return apiRequest('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async getCurrentUser(token: string) {
    return apiRequest('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

// User API functions
export const userAPI = {
  async createProfile(userData: {
    wallet_address: string;
    display_name: string;
    profile_picture_url?: string;
    social_links?: Record<string, string>;
  }) {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true); // Use auth token
  },

  async getProfile(walletAddress: string) {
    return apiRequest(`/users/${walletAddress}`, {}, true); // Use auth token (optional auth)
  },

  async updateProfile(walletAddress: string, updates: Record<string, any>) {
    return apiRequest(`/users/${walletAddress}`, {
      method: 'PATCH', // Changed from PUT to PATCH to match backend
      body: JSON.stringify(updates),
    }, true); // Use auth token
  },

  async deleteProfile(walletAddress: string) {
    return apiRequest(`/users/${walletAddress}`, {
      method: 'DELETE',
    }, true); // Use auth token
  },
};

// NFT API functions
export const nftAPI = {
  async createNFT(nftData: {
    token_id: string;
    creator_wallet: string;
    title: string;
    image_url: string;
    technique: string;
    physical_copy_available: boolean;
    physical_copy_price?: number;
    shipping_cost?: number;
  }) {
    return apiRequest('/nfts', {
      method: 'POST',
      body: JSON.stringify(nftData),
    });
  },

  async getNFTs(filters: {
    technique?: string;
    creator?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    return apiRequest(`/nfts${queryString ? `?${queryString}` : ''}`);
  },

  async getNFT(tokenId: string) {
    return apiRequest(`/nfts/${tokenId}`);
  },
};

// Physical Orders API functions
export const physicalOrderAPI = {
  async createOrder(orderData: {
    nft_token_id: string;
    buyer_wallet: string;
    artist_wallet: string;
    buyer_contact_details: string;
    escrow_contract_id: string;
  }) {
    return apiRequest('/physical-orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getOrders(filters: {
    buyer_wallet?: string;
    artist_wallet?: string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    return apiRequest(`/physical-orders${queryString ? `?${queryString}` : ''}`);
  },

  async updateOrderStatus(orderId: string, status: string, additionalData: Record<string, any> = {}) {
    return apiRequest(`/physical-orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...additionalData }),
    });
  },
};

// Artists API functions
export const artistAPI = {
  async getArtists(filters: {
    search?: string;
    technique?: string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    return apiRequest(`/artists${queryString ? `?${queryString}` : ''}`);
  },
};

// Stats API functions
export const statsAPI = {
  async getMarketplaceStats() {
    return apiRequest('/stats');
  },
};

// Upload API functions
export const uploadAPI = {
  /**
   * Upload a single file to IPFS
   * @param file - File to upload
   * @param onProgress - Callback for upload progress (0-100)
   */
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<{
    cid: string;
    url: string;
    ipfsUrl: string;
    size: number;
    filename: string;
    mimetype: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required for file upload');
    }

    const url = `${API_BASE_URL}/upload/file`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || 'Upload failed'));
            }
          } catch (err) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
          } catch (err) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Send request
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(metadata: Record<string, any>, name: string): Promise<{
    cid: string;
    url: string;
    ipfsUrl: string;
    name: string;
  }> {
    return apiRequest('/upload/metadata', {
      method: 'POST',
      body: JSON.stringify({ metadata, name }),
    }, true); // Use auth token
  },

  /**
   * Test if a file is accessible on IPFS
   */
  async testRetrieval(cid: string): Promise<{
    cid: string;
    url: string;
    ipfsUrl: string;
    accessible: boolean;
    contentType?: string;
    contentLength?: string;
  }> {
    return apiRequest(`/upload/test/${cid}`);
  },
};

// Utility function to handle API errors gracefully
export function handleAPIError(error: any, fallbackMessage: string = 'An error occurred') {
  console.error('API Error:', error);

  if (error.message) {
    return error.message;
  }

  return fallbackMessage;
}