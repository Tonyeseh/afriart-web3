import "./globals.css";
import { type ReactNode } from "react";
import { ToastProvider } from "./components/Toast";
import AppLayout from "./components/AppLayout";
import HederaWalletProvider from "contexts/WalletProvider";
import { AuthProvider } from "contexts/AuthContext";

export const metadata = {
  title: "AfriArt NFT Marketplace",
  description: "Showcasing and trading African digital art on Web3",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ToastProvider>
          <HederaWalletProvider>
            <AuthProvider>
              <AppLayout>{children}</AppLayout>
            </AuthProvider>
          </HederaWalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
