import * as jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { logger } from "../config/logger";
import { JwtStringValue } from "../types/auth.type";
import { recoverMessageAddress } from "viem";
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
    this.jwtSecret = process.env.JWT_SECRET || "";
    this.jwtExpiration = (process.env.JWT_EXPIRATION || "7d") as JwtStringValue;

    console.log(this.jwtSecret, "jwtSecret");
    if (!this.jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
  }

  /**
   * Creates a timestamped authentication message for the user to sign
   * The message is designed to be clear and user-friendly for EIP-191 signing
   */
  createAuthMessage(walletAddress: string): {
    timestamp: string;
    message: string;
    walletAddress: string;
  } {
    const timestamp = Date.now();

    // Create a simple, clear message for EIP-191 signing
    // EIP-191 will automatically add the prefix: "\x19Ethereum Signed Message:\n" + length
    const message = `Welcome to AfriArt!

Sign this message to authenticate your wallet.

Wallet: ${walletAddress}
Timestamp: ${timestamp}

This signature will not trigger any blockchain transaction or cost any fees.`;

    logger.info({ walletAddress, timestamp }, "Created auth message");
    return {
      timestamp: timestamp.toString(),
      walletAddress,
      message,
    };
  }

  /**
   * Validates that the auth message timestamp is within acceptable range
   */
  validateAuthMessage(message: string): boolean {
    try {
      const timestampMatch = message.match(/Timestamp: (\d+)/);
      if (!timestampMatch) {
        logger.warn("No timestamp found in auth message");
        return false;
      }

      const messageTimestamp = parseInt(timestampMatch[1], 10);
      const currentTimestamp = Date.now();
      const timeDiffMinutes = (currentTimestamp - messageTimestamp) / 1000 / 60;

      if (timeDiffMinutes > this.messageExpiryMinutes) {
        logger.warn(
          { timeDiffMinutes, maxMinutes: this.messageExpiryMinutes },
          "Auth message expired"
        );
        return false;
      }

      if (timeDiffMinutes < 0) {
        logger.warn("Auth message timestamp is in the future");
        return false;
      }

      return true;
    } catch (error) {
      logger.error({ error }, "Error validating auth message");
      return false;
    }
  }

  async validateTimeStamp(messageTimestamp: number) {
    const currentTimestamp = Date.now();
    const timeDiffMinutes = (currentTimestamp - messageTimestamp) / 1000 / 60;

    if (timeDiffMinutes > this.messageExpiryMinutes) {
      logger.warn(
        { timeDiffMinutes, maxMinutes: this.messageExpiryMinutes },
        "Auth message expired"
      );
      return false;
    }

    if (timeDiffMinutes < 0) {
      logger.warn("Auth message timestamp is in the future");
      return false;
    }

    return true;
  }

  /**
   * Verifies that the signature was created by the wallet owner using EIP-191
   * Recovers the signer's address from the signature and compares with expected address
   */
  async verifyWalletSignature(
    message: string,
    signature: string,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      logger.info(
        {
          expectedAddress,
          signatureLength: signature.length,
          signaturePreview: signature.substring(0, 50) + "...",
          message: message.substring(0, 100) + "...",
        },
        "Attempting EIP-191 signature verification"
      );

      // Validate signature format (should be 0x prefixed hex, 132 chars: 0x + 130 hex chars for 65 bytes)
      const signatureRegex = /^0x[0-9a-fA-F]{130}$/;
      if (!signatureRegex.test(signature)) {
        logger.warn(
          {
            signatureLength: signature.length,
            expected: 132,
            hasPrefix: signature.startsWith("0x"),
          },
          "Invalid signature format. Expected 0x + 130 hex characters (65 bytes: r + s + v)"
        );
        return false;
      }

      // Recover the address from the signature using viem
      // This automatically handles EIP-191 formatting: "\x19Ethereum Signed Message:\n" + length + message
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      });

      logger.debug(
        {
          expectedAddress: expectedAddress.toLowerCase(),
          recoveredAddress: recoveredAddress.toLowerCase(),
        },
        "Address recovery completed"
      );

      // Compare addresses (case-insensitive)
      const isValid =
        recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

      logger.info(
        {
          expectedAddress,
          recoveredAddress,
          isValid,
        },
        "EIP-191 signature verification result"
      );

      return isValid;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          expectedAddress,
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Error verifying wallet signature"
      );
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
      "Generated JWT token"
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
        logger.warn("Token expired");
        throw new Error("Token expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn({ error: error.message }, "Invalid token");
        throw new Error("Invalid token");
      }
      logger.error({ error }, "Error verifying token");
      throw new Error("Token verification failed");
    }
  }

  /**
   * Extracts wallet address from authentication message
   */
  extractWalletFromMessage(message: string): string | null {
    const walletMatch = message.match(/Wallet: (0\.0\.\d+)/);
    if (!walletMatch) {
      logger.warn("No wallet address found in message");
      return null;
    }
    return walletMatch[1];
  }
}

// Export singleton instance
export const authService = new AuthService();
