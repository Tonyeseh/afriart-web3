import { PublicKey } from '@hashgraph/sdk';
import * as jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { JwtStringValue } from '../types/auth.type';
import dotenv from "dotenv";

dotenv.config();

interface TokenPayload {
  userId: string;
  walletAddress: string;
  role: string;
}

interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiration: JwtStringValue | number;
  private readonly messageExpiryMinutes = 5;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || '';
    this.jwtExpiration = (process.env.JWT_EXPIRATION || '7d') as JwtStringValue;

    console.log(this.jwtSecret, "jwtSecret")
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  /**
   * Creates a timestamped authentication message for the user to sign
   */
  createAuthMessage(walletAddress: string): string {
    const timestamp = Date.now();
    const message = `AfriArt Authentication

Wallet: ${walletAddress}
Timestamp: ${timestamp}

Sign this message to prove you own this wallet.
This signature will not trigger any blockchain transaction or cost any fees.`;

    logger.info({ walletAddress, timestamp }, 'Created auth message');
    return message;
  }

  /**
   * Validates that the auth message timestamp is within acceptable range
   */
  validateAuthMessage(message: string): boolean {
    try {
      const timestampMatch = message.match(/Timestamp: (\d+)/);
      if (!timestampMatch) {
        logger.warn('No timestamp found in auth message');
        return false;
      }

      const messageTimestamp = parseInt(timestampMatch[1], 10);
      const currentTimestamp = Date.now();
      const timeDiffMinutes = (currentTimestamp - messageTimestamp) / 1000 / 60;

      if (timeDiffMinutes > this.messageExpiryMinutes) {
        logger.warn(
          { timeDiffMinutes, maxMinutes: this.messageExpiryMinutes },
          'Auth message expired'
        );
        return false;
      }

      if (timeDiffMinutes < 0) {
        logger.warn('Auth message timestamp is in the future');
        return false;
      }

      return true;
    } catch (error) {
      logger.error({ error }, 'Error validating auth message');
      return false;
    }
  }

  /**
   * Verifies that the signature was created by the wallet owner
   * Handles both base64-encoded signatureMaps (from wallets) and hex signatures
   */
  async verifyWalletSignature(
    message: string,
    signature: string,
    publicKeyString: string
  ): Promise<boolean> {
    try {
      logger.info(
        {
          publicKey: publicKeyString,
          signatureLength: signature.length,
          signaturePreview: signature.substring(0, 50) + '...'
        },
        'Attempting signature verification'
      );

      // Parse the public key
      const publicKey = PublicKey.fromString(publicKeyString);

      // The signature from Hedera wallet is base64-encoded signatureMap
      // Try base64 decoding first (most common from wallet extensions)
      let signatureBytes: Buffer;

      try {
        // Try base64 first (Hedera wallet format)
        signatureBytes = Buffer.from(signature, 'base64');
        logger.debug({ decodedLength: signatureBytes.length }, 'Decoded signature as base64');
      } catch (e) {
        // Fallback to hex if base64 fails
        try {
          signatureBytes = Buffer.from(signature, 'hex');
          logger.debug({ decodedLength: signatureBytes.length }, 'Decoded signature as hex');
        } catch (e2) {
          // If both fail, try as raw bytes
          signatureBytes = Buffer.from(signature);
          logger.debug({ decodedLength: signatureBytes.length }, 'Using signature as raw bytes');
        }
      }

      // Hedera signatures are typically 64 bytes (ED25519) or 65 bytes with recovery byte
      // If we have a signatureMap (proto format), we need to extract the actual signature
      if (signatureBytes.length > 100) {
        logger.debug({ length: signatureBytes.length }, 'SignatureMap detected, extracting signature');
        // SignatureMap is proto-encoded, we need to extract the signature bytes
        // The signature is typically at the end of the proto structure
        // For ED25519 signatures, look for the last 64 bytes
        signatureBytes = signatureBytes.slice(-64);
        logger.debug({ extractedLength: signatureBytes.length }, 'Extracted signature from map');
      }

      // Verify the signature
      const messageBytes = Buffer.from(message, 'utf-8');
      const isValid = publicKey.verify(messageBytes, signatureBytes);

      logger.info(
        {
          publicKey: publicKeyString,
          isValid,
          signatureBytesLength: signatureBytes.length,
          messageBytesLength: messageBytes.length
        },
        'Wallet signature verification result'
      );

      return isValid;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        publicKey: publicKeyString,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error verifying wallet signature');
      return false;
    }
  }

  /**
   * Generates a JWT token for authenticated users
   */
  generateToken(userId: string, walletAddress: string, role: string): string {
    const payload: TokenPayload = {
      userId,
      walletAddress,
      role,
    };

    const options: jwt.SignOptions = {
      expiresIn: this.jwtExpiration,
    };

    const token = jwt.sign(payload, this.jwtSecret, options);

    logger.info(
      { userId, walletAddress, role, expiresIn: this.jwtExpiration },
      'Generated JWT token'
    );

    return token;
  }

  /**
   * Verifies and decodes a JWT token
   */
  verifyToken(token: string): DecodedToken {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as DecodedToken;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expired');
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn({ error: error.message }, 'Invalid token');
        throw new Error('Invalid token');
      }
      logger.error({ error }, 'Error verifying token');
      throw new Error('Token verification failed');
    }
  }

  /**
   * Extracts wallet address from authentication message
   */
  extractWalletFromMessage(message: string): string | null {
    const walletMatch = message.match(/Wallet: (0\.0\.\d+)/);
    if (!walletMatch) {
      logger.warn('No wallet address found in message');
      return null;
    }
    return walletMatch[1];
  }
}

// Export singleton instance
export const authService = new AuthService();
