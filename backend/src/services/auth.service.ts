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
   */
  async verifyWalletSignature(
    message: string,
    signature: string,
    publicKeyString: string
  ): Promise<boolean> {
    try {
      // Convert hex signature to Uint8Array
      const signatureBytes = Buffer.from(signature, 'hex');

      // Parse the public key
      const publicKey = PublicKey.fromString(publicKeyString);

      // Verify the signature
      const isValid = publicKey.verify(
        Buffer.from(message, 'utf-8'),
        signatureBytes
      );

      logger.info(
        { publicKey: publicKeyString, isValid },
        'Wallet signature verification result'
      );

      return isValid;
    } catch (error) {
      logger.error({ error, publicKey: publicKeyString }, 'Error verifying wallet signature');
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
