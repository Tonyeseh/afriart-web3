import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-1d1c8284`;

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

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
    });
  },

  async getProfile(walletAddress: string) {
    return apiRequest(`/users/${walletAddress}`);
  },

  async updateProfile(walletAddress: string, updates: Record<string, any>) {
    return apiRequest(`/users/${walletAddress}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
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

// Utility function to handle API errors gracefully
export function handleAPIError(error: any, fallbackMessage: string = 'An error occurred') {
  console.error('API Error:', error);
  
  if (error.message) {
    return error.message;
  }
  
  return fallbackMessage;
}