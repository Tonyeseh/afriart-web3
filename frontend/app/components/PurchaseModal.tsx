import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { AlertTriangle } from 'lucide-react';
import { NFT } from './NFTCard';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT | null;
  mode: 'buy' | 'bid' | 'offer';
  onConfirm: (data: PurchaseData) => void;
}

export interface PurchaseData {
  includePhysical: boolean;
  contactDetails?: string;
  contactMethod?: string;
  offerAmount?: number;
  bidAmount?: number;
}

export function PurchaseModal({ isOpen, onClose, nft, mode, onConfirm }: PurchaseModalProps) {
  const [includePhysical, setIncludePhysical] = useState(false);
  const [contactDetails, setContactDetails] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  if (!nft) return null;

  const physicalCopyPrice = 50; // Mock price
  const shippingCost = 25; // Mock shipping cost
  
  const basePrice = mode === 'offer' ? (parseFloat(offerAmount) || 0) : 
                   mode === 'bid' ? (parseFloat(bidAmount) || 0) : nft.price;
  
  const totalPrice = includePhysical ? basePrice + physicalCopyPrice + shippingCost : basePrice;

  const handleConfirm = () => {
    const data: PurchaseData = {
      includePhysical,
      contactDetails: includePhysical ? contactDetails : undefined,
      contactMethod: includePhysical ? contactMethod : undefined,
      offerAmount: mode === 'offer' ? parseFloat(offerAmount) : undefined,
      bidAmount: mode === 'bid' ? parseFloat(bidAmount) : undefined,
    };
    onConfirm(data);
    onClose();
  };

  const getTitle = () => {
    switch (mode) {
      case 'buy': return 'Purchase NFT';
      case 'bid': return 'Place Bid';
      case 'offer': return 'Make Offer';
      default: return 'Transaction';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Info */}
          <div className="flex items-center space-x-4">
            <img src={nft.image} alt={nft.title} className="w-16 h-16 rounded-lg object-cover" />
            <div>
              <h3 className="font-semibold">{nft.title}</h3>
              <p className="text-sm text-gray-400">by {nft.creator}</p>
            </div>
          </div>

          {/* Offer/Bid Amount Input */}
          {(mode === 'offer' || mode === 'bid') && (
            <div className="space-y-2">
              <Label>{mode === 'offer' ? 'Offer Amount' : 'Bid Amount'} (HBAR)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={mode === 'offer' ? offerAmount : bidAmount}
                onChange={(e) => mode === 'offer' ? setOfferAmount(e.target.value) : setBidAmount(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
              {mode === 'bid' && nft.currentBid && (
                <p className="text-xs text-gray-400">
                  Minimum bid: {nft.currentBid + 1} HBAR
                </p>
              )}
            </div>
          )}

          {/* Physical Copy Toggle */}
          {nft.physicalCopy && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="physical-copy">Include Physical Copy</Label>
                <Switch 
                  id="physical-copy"
                  checked={includePhysical}
                  onCheckedChange={setIncludePhysical}
                />
              </div>

              {includePhysical && (
                <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  {/* Warning */}
                  <div className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <p className="text-sm text-red-400">
                      The artist will use an external service for shipping. Buyers are encouraged to request tracking details from the artist.
                    </p>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2">
                    <Label>Contact Details</Label>
                    <Textarea
                      placeholder="Enter your contact information..."
                      value={contactDetails}
                      onChange={(e) => setContactDetails(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  {/* Contact Method */}
                  <div className="space-y-2">
                    <Label>Preferred Contact Method</Label>
                    <Select value={contactMethod} onValueChange={setContactMethod}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
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
                </div>
              )}
            </div>
          )}

          {/* Price Breakdown */}
          <div className="space-y-2">
            <Separator className="bg-gray-700" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">NFT Price</span>
                <span>{basePrice.toLocaleString()} HBAR</span>
              </div>
              {includePhysical && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Physical Copy</span>
                    <span>{physicalCopyPrice} HBAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping</span>
                    <span>{shippingCost} HBAR</span>
                  </div>
                </>
              )}
              <Separator className="bg-gray-700" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{totalPrice.toLocaleString()} HBAR</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={
                (mode === 'offer' && !offerAmount) || 
                (mode === 'bid' && !bidAmount) ||
                (includePhysical && (!contactDetails || !contactMethod))
              }
            >
              Confirm {getTitle()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}