/**
 * TypeScript declarations for Hedera wallet browser extensions
 *
 * These wallets inject global objects into the window for interacting
 * with Hedera accounts and signing transactions/messages with ED25519 keys.
 */

/**
 * HashPack Wallet Extension API
 * https://hashpack.app
 */
interface HashPackSignMessageParams {
  message: string;
  signingAccount: string; // Hedera account ID (0.0.xxxxx)
}

interface HashPackSignMessageResponse {
  success: boolean;
  signatureMap: string; // Base64-encoded protobuf SignatureMap with ED25519 signature
  error?: string;
}

interface HashPackAPI {
  signMessage(params: HashPackSignMessageParams): Promise<HashPackSignMessageResponse>;
  // Add other HashPack methods as needed
}

/**
 * Blade Wallet Extension API
 * https://bladewallet.io
 */
interface BladeSignResponse {
  success: boolean;
  signatureMap: string; // Base64-encoded protobuf SignatureMap with ED25519 signature
  error?: string;
}

interface BladeAPI {
  sign(message: string, signingAccount: string): Promise<BladeSignResponse>;
  // Add other Blade methods as needed
}

/**
 * Extend the Window interface to include Hedera wallet globals
 */
declare global {
  interface Window {
    hashpack?: HashPackAPI;
    blade?: BladeAPI;
  }
}

export {};
