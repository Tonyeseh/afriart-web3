"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useHederaConnector } from './WalletProvider';
import { authAPI } from '../app/utils/api';

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
  const { walletConnector } = useHederaConnector();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

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
      console.log('Step 1: Initializing wallet connector...');
      // Initialize wallet connector
      await walletConnector.init();

      console.log('Step 2: Opening wallet modal...');
      // Open wallet selection modal
      const session = await walletConnector.openModal();

      if (!session) {
        throw new Error('Failed to connect wallet - no session returned');
      }

      console.log('Session received:', session);

      // Get the connected wallet address from session
      // The session has namespaces with accounts in CAIP-10 format
      // Example: "hedera:testnet:0.0.12345"
      const hederaNamespace = session.namespaces?.hedera;

      if (!hederaNamespace || !hederaNamespace.accounts || hederaNamespace.accounts.length === 0) {
        throw new Error('No Hedera account found in session');
      }

      // Extract account ID from CAIP-10 format (hedera:testnet:0.0.12345)
      const account = hederaNamespace.accounts[0];
      const walletAddress = account.split(':')[2]; // Gets "0.0.12345"

      console.log('Wallet address extracted:', walletAddress);

      if (!walletAddress || !walletAddress.match(/^0\.0\.\d+$/)) {
        throw new Error(`Invalid Hedera account ID format: ${walletAddress}`);
      }

      console.log('Step 3: Getting authentication message from backend...');
      // Step 1: Get authentication message from backend
      const messageResponse = await authAPI.getAuthMessage(walletAddress);
      console.log('Message response:', messageResponse);

      // Extract message - handle different response structures
      const message = messageResponse.data?.message || messageResponse.message;

      if (!message || typeof message !== 'string') {
        console.error('Invalid message response:', messageResponse);
        throw new Error('No authentication message received from backend');
      }

      console.log('Message to sign:', message);

      console.log('Step 4: Signing message with wallet...');
      // Step 2: Sign the message with the wallet
      // SignMessageResult type: { id: number; jsonrpc: string; result: { signatureMap: string } }
      const signResult = await walletConnector.signMessage({
        message: message, // Send as string
        signerAccountId: account // Use full CAIP-10 format
      });

      console.log('Sign result:', signResult);

      if (!signResult || !signResult.result) {
        throw new Error('Failed to sign message - no result returned');
      }

      // Extract signature from result.signatureMap
      const signatureMap = signResult.result.signatureMap;

      if (!signatureMap) {
        console.error('Sign result structure:', JSON.stringify(signResult, null, 2));
        throw new Error('Failed to extract signature from sign result');
      }

      console.log('Signature extracted:', signatureMap);

      console.log('Step 5: Verifying signature with backend...');
      // Step 3: Verify signature with backend
      // Note: publicKey is not provided by signMessage, backend will need to derive it
      const verifyResponse = await authAPI.verifySignature({
        walletAddress,
        message,
        signature: signatureMap, // Base64 encoded signatureMap
        publicKey: '' // Not available from signMessage response
      });

      console.log('Verification response:', verifyResponse);

      // Step 4: Handle response based on registration status
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
  }, [walletConnector]);

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

      // Disconnect from wallet connector
      await walletConnector.disconnectAll();

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
  }, [token, walletConnector]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
