import { useState } from 'react';
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';

interface NavbarProps {
  isWalletConnected: boolean;
  walletAddress?: string;
  onConnectWallet: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navbar({ isWalletConnected, walletAddress, onConnectWallet, currentPage, onNavigate }: NavbarProps) {
  const menuItems = [
    { label: 'Home', page: 'home' },
    { label: 'About', page: 'about' },
    { label: 'Gallery', page: 'gallery' },
    { label: 'Artist', page: 'artist' },
    { label: 'My Portfolio', page: 'portfolio' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={() => onNavigate('home')}
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              AfriArt
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {menuItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    currentPage === item.page
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center">
            {isWalletConnected ? (
              <div className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                <Wallet className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-purple-400">
                  {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : '0.0.123...456'}
                </span>
              </div>
            ) : (
              <Button 
                onClick={onConnectWallet}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}