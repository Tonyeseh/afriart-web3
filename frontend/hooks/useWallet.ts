import { Provider, useAppKit, useAppKitAccount, useAppKitProvider, useAppKitState } from '@reown/appkit/react';
import { useSignMessage, useDisconnect, useConnectorClient } from 'wagmi';
import { useCallback, useState, useEffect } from 'react';
import { hederaMirrorAPI } from '../app/utils/api';

// Storage key for Hedera account ID
const HEDERA_ACCOUNT_KEY = 'hedera_account_id';

/**
 * Custom hook for wallet operations using Reown AppKit
 *
 * Provides a simplified interface for wallet connectivity, signing messages,
 * and managing wallet state with ED25519 signature support for Hedera wallets
 */
export function useWallet() {
  const { open, close } = useAppKit();
  const { address, isConnected, caipAddress, status, allAccounts } = useAppKitAccount();
  const { selectedNetworkId } = useAppKitState();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const {walletProvider} = useAppKitProvider<Provider>("eip155");
  const { data: connectorClient } = useConnectorClient();
  const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);
  const [isFetchingAccountId, setIsFetchingAccountId] = useState(false);

  /**
   * Fetch Hedera account ID from Mirror Node when EVM address is detected
   */
  useEffect(() => {
    const fetchAccountId = async () => {
      if (!address || !isConnected) {
        setHederaAccountId(null);
        return;
      }

      // Check if already stored
      const stored = localStorage.getItem(`${HEDERA_ACCOUNT_KEY}_${address}`);
      if (stored) {
        console.log('Using stored Hedera account ID:', stored);
        setHederaAccountId(stored);
        return;
      }

      // If address is EVM format (0x...), fetch from Mirror Node
      if (address.startsWith('0x')) {
        console.log('Detected EVM address, fetching Hedera account ID from Mirror Node...');
        setIsFetchingAccountId(true);

        try {
          const accountId = await hederaMirrorAPI.getAccountIdFromEvmAddress(address);

          if (accountId) {
            console.log('Found Hedera account ID:', accountId);
            // Store for future use
            localStorage.setItem(`${HEDERA_ACCOUNT_KEY}_${address}`, accountId);
            setHederaAccountId(accountId);
          } else {
            console.warn('No Hedera account found for EVM address:', address);
            setHederaAccountId(null);
          }
        } catch (error) {
          console.error('Error fetching Hedera account ID:', error);
          setHederaAccountId(null);
        } finally {
          setIsFetchingAccountId(false);
        }
      } else {
        // Address might already be in Hedera format
        setHederaAccountId(address);
      }
    };

    fetchAccountId();
  }, [address, isConnected]);

  /**
   * Open wallet connection modal
   */
  const connect = useCallback(async () => {
    await open();
  }, [open]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(async () => {
    disconnect();
    close();
    setHederaAccountId(null);
  }, [disconnect, close]);

  /**
   * Sign a message with the connected wallet using EIP-191 format
   *
   * All wallets now use Wagmi's signMessage which automatically applies EIP-191 formatting:
   * "\x19Ethereum Signed Message:\n" + message.length + message
   *
   * This ensures consistent signature verification on the backend using viem.
   *
   * @param message - The message to sign
   * @returns Promise with the signature (hex string with 0x prefix)
   */
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      console.log('Signing message with EIP-191 format via Wagmi');

      // Use Wagmi's signMessage which automatically applies EIP-191 format
      // This works with all EVM-compatible wallets including HashPack, Blade, MetaMask, etc.
      const signature = await signMessageAsync({
        message,
        account: address as `0x${string}`
      });

      console.log('Signature obtained:', signature.substring(0, 20) + '...');
      return signature;
    },
    [isConnected, address, signMessageAsync]
  );

  const getPublicKey = useCallback(() => {
    const publicKeys = allAccounts.map(acc => acc.publicKey)
    console.log(publicKeys, "publicKeys");
    console.log(allAccounts, "allAccounts")
    return publicKeys[0];
  }, [address])

  /**
   * Set and store the Hedera account ID for the connected wallet
   */
  const setAccountId = useCallback((accountId: string) => {
    if (address) {
      localStorage.setItem(`${HEDERA_ACCOUNT_KEY}_${address}`, accountId);
      setHederaAccountId(accountId);
    }
  }, [address]);

  /**
   * Get the Hedera account ID
   * First tries to get from CAIP address (if wallet provides it),
   * then falls back to stored value
   */
  const getAccountId = useCallback((): string | null => {
    // Try to parse CAIP address first (format: "hedera:testnet:0.0.12345")
    if (caipAddress && caipAddress.includes('hedera:')) {
      const parts = caipAddress.split(':');
      if (parts.length >= 3 && parts[2].match(/^0\.0\.\d+$/)) {
        return parts[2]; // Returns "0.0.12345"
      }
    }

    // Fall back to stored Hedera account ID
    return hederaAccountId;
  }, [caipAddress, hederaAccountId]);

  /**
   * Get the current network (mainnet or testnet)
   */
  const getNetwork = useCallback((): 'mainnet' | 'testnet' | null => {
    if (!selectedNetworkId) return null;

    // Hedera Testnet ID is 296
    // Hedera Mainnet ID is 295
    const networkId = Number(selectedNetworkId);
    if (networkId === 296) return 'testnet';
    if (networkId === 295) return 'mainnet';

    return null;
  }, [selectedNetworkId]);

  return {
    // Connection state
    address,
    isConnected,
    caipAddress,
    status,
    accountId: getAccountId(),
    network: getNetwork(),
    isFetchingAccountId, // Expose fetching state

    // Actions
    connect,
    disconnect: disconnectWallet,
    signMessage,
    setAccountId, // Allow setting Hedera account ID manually
    openModal: open,
    closeModal: close,
    getPublicKey
  };
}
