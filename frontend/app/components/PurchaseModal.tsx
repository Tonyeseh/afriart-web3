import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { AlertTriangle, Loader2, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useHederaConnector } from '../../contexts/WalletProvider';
import { NFT } from './NFTCard';

interface NFTData {
  id: string;
  tokenId: string;
  title: string;
  image: string;
  price: number;
  usdPrice: number;
  creator: string;
  technique: string;
  physicalCopy?: boolean;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFTData;
  buyerWallet: string;
  onSuccess: () => void;
}

type PurchaseState = 'form' | 'signing' | 'pending' | 'success' | 'error';

export function PurchaseModal({ isOpen, onClose, nft, buyerWallet, onSuccess }: PurchaseModalProps) {
  // Form state
  const [includePhysical, setIncludePhysical] = useState(false);
  const [contactDetails, setContactDetails] = useState('');
  const [contactMethod, setContactMethod] = useState('');

  // Transaction state
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [progress, setProgress] = useState(0);

  const { walletConnector } = useHederaConnector();

  const physicalCopyPrice = 50; // This should come from NFT data
  const shippingCost = 25;
  const basePrice = nft.price || 0;
  const baseUsdPrice = nft.usdPrice || (basePrice * 0.25); // Fallback to HBAR to USD conversion if not provided
  const totalPrice = includePhysical ? basePrice + physicalCopyPrice + shippingCost : basePrice;
  const totalUsdPrice = includePhysical
    ? baseUsdPrice + (physicalCopyPrice * 0.25) + (shippingCost * 0.25)
    : baseUsdPrice;

  const handlePurchase = async () => {
    try {
      setPurchaseState('signing');
      setProgress(0);
      setErrorMessage('');

      // Validate physical copy details if needed
      if (includePhysical && (!contactDetails || !contactMethod)) {
        setErrorMessage('Please provide contact details for physical copy delivery');
        setPurchaseState('error');
        return;
      }

      // Step 1: Get JWT token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      setProgress(25);

      // Step 2: Call real purchase API endpoint
      setPurchaseState('pending');
      setProgress(50);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/nfts/${nft.id}/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            expectedPrice: basePrice, // Only digital NFT price
            includePhysical,
            contactDetails: includePhysical ? contactDetails : undefined,
            contactMethod: includePhysical ? contactMethod : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Purchase failed');
      }

      // Purchase successful
      setTransactionId(result.data.transactionId);
      setProgress(100);
      setPurchaseState('success');

      // Call onSuccess after a short delay to show success state
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Purchase error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
      setPurchaseState('error');
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (purchaseState === 'signing' || purchaseState === 'pending') {
      // Don't allow closing during transaction
      return;
    }
    setPurchaseState('form');
    setErrorMessage('');
    setProgress(0);
    onClose();
  };

  const renderFormState = () => (
    <div className="space-y-6">
      {/* NFT Info */}
      <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
        <img src={nft.image} alt={nft.title} className="w-20 h-20 rounded-lg object-cover" />
        <div className="flex-1">
          <h3 className="font-semibold text-white text-lg">{nft.title}</h3>
          <p className="text-sm text-gray-400">by {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}</p>
          <p className="text-sm text-purple-400 mt-1">{nft.technique}</p>
        </div>
      </div>

      {/* Buyer Wallet */}
      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <Wallet className="h-5 w-5 text-purple-400" />
        <div className="flex-1">
          <p className="text-xs text-gray-400">Paying from</p>
          <p className="text-sm text-white font-mono">{buyerWallet}</p>
        </div>
      </div>

      {/* Physical Copy Toggle */}
      {nft.physicalCopy && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <Label htmlFor="physical-copy" className="text-white">Include Physical Copy</Label>
            <Switch
              id="physical-copy"
              checked={includePhysical}
              onCheckedChange={setIncludePhysical}
            />
          </div>

          {includePhysical && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700"
            >
              {/* Warning */}
              <div className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-400">
                  The artist will use an external service for shipping. Buyers are encouraged to request tracking details from the artist.
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-2">
                <Label className="text-white">Contact Details *</Label>
                <Textarea
                  placeholder="Enter your full address and contact information..."
                  value={contactDetails}
                  onChange={(e) => setContactDetails(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>

              {/* Contact Method */}
              <div className="space-y-2">
                <Label className="text-white">Preferred Contact Method *</Label>
                <Select value={contactMethod} onValueChange={setContactMethod}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select contact method" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-3 p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-700">
        <div className="flex justify-between text-gray-300">
          <span>NFT Price</span>
          <span>{basePrice.toLocaleString()} HBAR</span>
        </div>
        {includePhysical && (
          <>
            <div className="flex justify-between text-gray-300">
              <span>Physical Copy</span>
              <span>{physicalCopyPrice} HBAR</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Shipping</span>
              <span>{shippingCost} HBAR</span>
            </div>
          </>
        )}
        <Separator className="bg-purple-700" />
        <div className="flex justify-between font-bold text-xl text-white">
          <span>Total</span>
          <div className="text-right">
            <div>{totalPrice.toLocaleString()} HBAR</div>
            <div className="text-sm text-gray-400 font-normal">≈ ${totalUsdPrice.toFixed(2)} USD</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={handleClose}
          className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handlePurchase}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          disabled={includePhysical && (!contactDetails || !contactMethod)}
        >
          Confirm Purchase
        </Button>
      </div>
    </div>
  );

  const renderSigningState = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="relative">
          <Wallet className="h-20 w-20 text-purple-400" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-purple-400/20"
          />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Sign Transaction</h3>
        <p className="text-gray-400">
          Please approve the transaction in your wallet
        </p>
      </div>

      <Progress value={progress} className="w-full max-w-md mx-auto" />

      <p className="text-sm text-gray-500">
        Do not close this window
      </p>
    </div>
  );

  const renderPendingState = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <Loader2 className="h-20 w-20 text-purple-400 animate-spin" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Processing Transaction</h3>
        <p className="text-gray-400">
          Your transaction is being processed on the Hedera network
        </p>
        {transactionId && (
          <p className="text-sm text-purple-400 mt-2 font-mono">
            TX: {transactionId.slice(0, 20)}...
          </p>
        )}
      </div>

      <Progress value={progress} className="w-full max-w-md mx-auto" />

      <p className="text-sm text-gray-500">
        This may take a few moments. Please wait...
      </p>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center space-y-6 py-8">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <CheckCircle className="h-24 w-24 text-green-400" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full bg-green-400/20"
            />
          </div>
        </div>
      </motion.div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h3>
        <p className="text-gray-400 mb-4">
          You now own <span className="text-white font-semibold">{nft.title}</span>
        </p>
        {transactionId && (
          <a
            href={`https://hashscan.io/testnet/transaction/${transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            View on HashScan →
          </a>
        )}
      </div>

      {includePhysical && (
        <div className="p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
          <p className="text-sm text-purple-300">
            The artist will contact you at your provided details to arrange shipping.
          </p>
        </div>
      )}

      <Button
        onClick={onSuccess}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        View in My Collection
      </Button>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <XCircle className="h-20 w-20 text-red-400" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Transaction Failed</h3>
        <p className="text-gray-400 mb-4">{errorMessage}</p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleClose}
          variant="outline"
          className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Close
        </Button>
        <Button
          onClick={() => {
            setPurchaseState('form');
            setErrorMessage('');
            setProgress(0);
          }}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Try Again
        </Button>
      </div>
    </div>
  );

  const getTitle = () => {
    switch (purchaseState) {
      case 'form':
        return 'Purchase NFT';
      case 'signing':
        return 'Sign Transaction';
      case 'pending':
        return 'Processing...';
      case 'success':
        return 'Success!';
      case 'error':
        return 'Transaction Failed';
      default:
        return 'Purchase NFT';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {purchaseState === 'form' && <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderFormState()}</motion.div>}
          {purchaseState === 'signing' && <motion.div key="signing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderSigningState()}</motion.div>}
          {purchaseState === 'pending' && <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderPendingState()}</motion.div>}
          {purchaseState === 'success' && <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderSuccessState()}</motion.div>}
          {purchaseState === 'error' && <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderErrorState()}</motion.div>}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
