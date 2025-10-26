"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import {
  Wallet,
  Menu,
  X,
  Bell,
  User,
  Settings,
  LogOut,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Badge } from './ui/badge';

interface Notification {
  id: string;
  message: string;
  type: 'bid' | 'sale' | 'order' | 'info';
  timestamp: Date;
  read: boolean;
}

interface NavbarProps {
  isWalletConnected: boolean;
  walletAddress?: string;
  onConnectWallet: () => void;
  onDisconnectWallet?: () => void;
}

export function Navbar({
  isWalletConnected,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock notifications - will be replaced with real data
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      message: 'You received a new bid of 150 HBAR on "Sunset Dreams"',
      type: 'bid',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false
    },
    {
      id: '2',
      message: 'Your auction for "Ocean Vibes" has ended',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { label: 'Home', page: 'home', href: '/' },
    { label: 'About', page: 'about', href: '/about' },
    { label: 'Gallery', page: 'gallery', href: '/gallery' },
    { label: 'Artist', page: 'artist', href: '/artist' },
    { label: 'My Portfolio', page: 'portfolio', href: '/portfolio' }
  ];

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            >
              AfriArt
            </Link>

            {/* Network Indicator */}
            <div className="hidden lg:flex items-center space-x-2 ml-4 px-3 py-1 bg-yellow-900/20 border border-yellow-600 rounded text-xs text-yellow-400">
              <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />
              <span>Testnet</span>
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.page}
                  href={item.href}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    pathname === item.href
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications Bell (only when wallet connected) */}
            {isWalletConnected && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative hidden sm:flex"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-0"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-gray-900 border-gray-800 p-0">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="font-semibold text-white">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-800">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                              !notification.read ? 'bg-purple-900/10' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-300 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Wallet Connection / User Dropdown */}
            {isWalletConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30"
                  >
                    <Wallet className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-purple-400 hidden sm:inline">
                      {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '0.0.123...'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800">
                  <DropdownMenuItem asChild>
                    <Link href="/portfolio" className="flex items-center cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      My Portfolio
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/portfolio" className="flex items-center cursor-pointer">
                      <Package className="h-4 w-4 mr-2" />
                      My Collection
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/portfolio" className="flex items-center cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem
                    onClick={onDisconnectWallet}
                    className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={onConnectWallet}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                className="text-gray-300"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-800">
            <div className="flex flex-col space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.page}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    pathname === item.href
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Network Indicator (Mobile) */}
              <div className="lg:hidden flex items-center space-x-2 px-3 py-2 bg-yellow-900/20 border border-yellow-600 rounded text-xs text-yellow-400 w-fit">
                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse" />
                <span>Testnet</span>
              </div>

              {/* Mobile Notifications */}
              {isWalletConnected && unreadCount > 0 && (
                <div className="sm:hidden px-3 py-2 text-gray-400 text-sm">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}