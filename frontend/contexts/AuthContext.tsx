"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { authAPI, hederaMirrorAPI } from '../app/utils/api';
import { HederaAccountModal } from '../app/components/HederaAccountModal';

interface User {
  id: string;
  walletAddress: string;
  role: 'buyer' | 'artist' | 'admin';
  displayName?: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  walletAddress: string;
  role: 'buyer' | 'artist' | 'admin';
  displayName?: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'afriart_auth_token';
const USER_KEY = 'afriart_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [pendingEvmAddress, setPendingEvmAddress] = useState<string>('');
  const [walletAddress, setWalletAddress]  = useState<string>("")

  // Load token and user from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setWalletAddress(user.walletAddress)

          // Verify token is still valid by fetching current user
          try {
            const freshUser = await authAPI.getCurrentUser(storedToken);
            setUser(freshUser);
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          } catch (err) {
            // Token invalid or expired, clear auth state
            console.error('Token validation failed:', err);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error loading auth state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Save token and user to localStorage whenever they change
  useEffect(() => {
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [token, user]);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Step 1: Opening wallet connection modal...');

      // Open wallet modal if not already connected
      if (!wallet.isConnected) {
        await wallet.connect();

        // Wait a moment for the connection to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Get wallet address after connection
      let walletAddress = wallet.accountId;

      console.log('Wallet connected:', {
        address: wallet.address,
        accountId: walletAddress,
        caipAddress: wallet.caipAddress,
        isFetchingAccountId: wallet.isFetchingAccountId
      });

      // If still fetching account ID from Mirror Node, wait for it
      if (wallet.isFetchingAccountId) {
        console.log('Waiting for Hedera account ID to be fetched from Mirror Node...');

        // Wait for the account ID to be fetched (with timeout)
        const maxWaitTime = 10000; // 10 seconds
        const startTime = Date.now();

        while (wallet.isFetchingAccountId && (Date.now() - startTime) < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 500));
          walletAddress = wallet.accountId;
        }

        console.log('Account ID after waiting:', walletAddress);
      }

      // Check if we got a Hedera account ID or an EVM address
      if (!walletAddress || !walletAddress.match(/^0\.0\.\d+$/)) {
        // If we got an EVM address (0x...), and couldn't auto-fetch the account ID
        if (wallet.address && wallet.address.startsWith('0x')) {
          console.log('Could not auto-fetch Hedera account ID, showing modal...');

          // Show modal to get Hedera account ID as fallback
          setPendingEvmAddress(wallet.address);
          setShowAccountModal(true);
          setIsLoading(false);

          // Return early - the flow will continue when user submits the modal
          return;
        } else {
          throw new Error(`Invalid wallet address format. Expected Hedera account ID (0.0.xxxxx), got: ${walletAddress || wallet.address}`);
        }
      }

      console.log('Wallet address validated:', walletAddress);

      // Get EVM address (needed for signature verification)
      const evmAddress = wallet.address;
      if (!evmAddress || !evmAddress.startsWith('0x')) {
        throw new Error('Could not retrieve EVM address from wallet');
      }

      console.log('EVM address:', evmAddress);

      console.log('Step 2: Getting authentication message from backend...');

      // Get authentication message from backend
      const messageResponse = await authAPI.getAuthMessage(walletAddress);
      console.log('Message response:', messageResponse);

      // Extract message - handle different response structures
      const message = messageResponse.data.message;

      console.log(message)

      if (!message || !messageResponse.success) {
        console.error('Invalid message response:', messageResponse);
        throw new Error('No authentication message received from backend');
      }

      console.log('Message to sign:', message);

      console.log('Step 3: Signing message with wallet (EIP-191 format)...');

      // Sign the message with the wallet (automatically uses EIP-191 format)
      const signature = await wallet.signMessage(message);

      console.log('Signature received:', signature);

      if (!signature) {
        throw new Error('Failed to sign message - no signature returned');
      }

      console.log('Step 4: Verifying signature with backend...');

      // Verify signature with backend
      // Backend will recover the address from the signature and verify it matches evmAddress
      const verifyResponse = (await authAPI.verifySignature({
        walletAddress,    // Hedera account ID (0.0.xxxxx) for database lookup
        message,          // The message that was signed
        signature,        // The EIP-191 signature
        evmAddress        // EVM address for signature verification
      })).data;

      console.log('Verification response:', verifyResponse);

      // Handle response based on registration status
      if (verifyResponse.needsRegistration) {
        // New user - need to register
        console.log('New user detected, showing registration modal');
        setError('NEW_USER_REGISTRATION_NEEDED');
        setIsLoading(false);
        // Store wallet address for registration form
        sessionStorage.setItem('pending_wallet_address', walletAddress);
        return;
      }

      // Existing user - set auth state
      if (verifyResponse.token && verifyResponse.user) {
        console.log('Login successful!');
        setToken(verifyResponse.token);
        setUser(verifyResponse.user);
      } else {
        throw new Error('Invalid response from server - missing token or user data');
      }

    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  const register = useCallback(async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.register(userData);

      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        // Clear pending wallet address
        sessionStorage.removeItem('pending_wallet_address');
      } else {
        throw new Error('Invalid registration response');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      // Call logout endpoint if we have a token
      if (token) {
        try {
          await authAPI.logout(token);
        } catch (err) {
          console.error('Logout API call failed:', err);
          // Continue with local logout even if API call fails
        }
      }

      // Disconnect from wallet
      await wallet.disconnect();

      // Clear auth state
      setToken(null);
      setUser(null);
      setError(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (err) {
      console.error('Disconnect error:', err);
      // Force clear even on error
      setToken(null);
      setUser(null);
    }
  }, [token, wallet]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const freshUser = await authAPI.getCurrentUser(token);
      setUser(freshUser);
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // If refresh fails, user might need to re-authenticate
      disconnectWallet();
    }
  }, [token, disconnectWallet]);

  /**
   * Handle Hedera account ID submission from modal
   */
  const handleAccountIdSubmit = useCallback(async (accountId: string) => {
    setShowAccountModal(false);
    setIsLoading(true);

    try {
      // Store the account ID
      wallet.setAccountId(accountId);

      // Continue with the authentication flow
      console.log('Using provided Hedera account ID:', accountId);

      // Now continue with the rest of the connectWallet flow
      await connectWallet();
    } catch (err: any) {
      console.error('Authentication error after account ID submission:', err);
      setError(err.message || 'Failed to authenticate');
      setIsLoading(false);
    }
  }, [wallet, connectWallet]);

  /**
   * Handle modal cancellation
   */
  const handleAccountIdCancel = useCallback(() => {
    setShowAccountModal(false);
    setPendingEvmAddress('');
    wallet.disconnect();
  }, [wallet]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    register,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <HederaAccountModal
        isOpen={showAccountModal}
        evmAddress={pendingEvmAddress}
        onSubmit={handleAccountIdSubmit}
        onCancel={handleAccountIdCancel}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
