import { Client, PrivateKey } from "@hashgraph/sdk";
import { logger } from "./logger";

export class HederaClient {
    private static instance: Client | null = null;
    private static operatorKey: PrivateKey | null = null;

    static getClient(): Client {
        if (!this.instance) {
            const network = process.env.HEDERA_NETWORK || 'testnet';
      const operatorId = process.env.HEDERA_OPERATOR_ID;
      const operatorKeyString = process.env.HEDERA_OPERATOR_KEY;

      if (!operatorId || !operatorKeyString)
        throw new Error('Hedera credentials not configured')

      this.operatorKey = PrivateKey.fromStringDer(operatorKeyString);
      this.instance = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();

      this.instance.setOperator(operatorId, this.operatorKey);
      logger.info(`Hedera client initialized for ${network}`);
        }

        return this.instance;
    }

    static getOperatorKey(): PrivateKey {
        // Ensure client is initialized first
        if (!this.operatorKey) {
            this.getClient(); // This will initialize the operatorKey
        }

        if (!this.operatorKey) {
            throw new Error('Hedera operator key not initialized');
        }

        return this.operatorKey;
    }
}