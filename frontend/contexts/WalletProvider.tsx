"use client";
import {
  HederaSessionEvent,
  DAppConnector,
  HederaChainId,
  HederaJsonRpcMethod,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hashgraph/sdk";
import { createContext, useContext, useMemo } from "react";

const metadata = {
  name: "Afriart v1",
  description: "Hedera Afriart application",
  url: "localhost",
  icons: ["https://avatars.githubusercontent.com/u/31002956"],
};

const createDAppConnector = () =>
  new DAppConnector(
    metadata,
    LedgerId.TESTNET,
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
      "18a885a9b1d046716dc2067f815a4588",
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    [HederaChainId.Mainnet, HederaChainId.Testnet]
  );

interface WalletProviderContext {
  walletConnector: DAppConnector;
}

const WalletContext = createContext<WalletProviderContext | undefined>(
  undefined
);

//More specific error message
function useHederaConnector() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error(
      "useHederaConnector must be used within a HederaWalletProvider"
    );
  }
  return context;
}

interface ProviderProps {
  children: React.ReactNode;
}

function HederaWalletProvider({ children }: ProviderProps) {
  //Use useMemo to ensure stable reference if recreating inside component
  const walletConnector = useMemo(() => createDAppConnector(), []);

  const value = useMemo(() => ({ walletConnector }), [walletConnector]);

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export { HederaWalletProvider, useHederaConnector };
export default HederaWalletProvider;
