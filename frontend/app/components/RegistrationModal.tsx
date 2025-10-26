"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, User, Mail, Palette, ShoppingBag, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

export function RegistrationModal({ isOpen, onClose, walletAddress }: RegistrationModalProps) {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    role: '' as 'buyer' | 'artist' | '',
    displayName: '',
    email: '',
    bio: '',
    profilePictureUrl: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      website: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role) {
      setError('Please select your role');
      return;
    }

    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Filter out empty social links
      const cleanedSocialLinks = Object.entries(formData.socialLinks)
        .filter(([_, value]) => value.trim() !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      await register({
        walletAddress,
        role: formData.role,
        displayName: formData.displayName.trim(),
        email: formData.email.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        profilePictureUrl: formData.profilePictureUrl.trim() || undefined,
        socialLinks: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : undefined
      });

      // Success - modal will close via parent component
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'buyer',
      label: 'Buyer',
      icon: ShoppingBag,
      description: 'I want to collect and purchase NFT art'
    },
    {
      value: 'artist',
      label: 'Artist',
      icon: Palette,
      description: 'I want to create and sell my artwork as NFTs'
    },
    {
      value: 'admin',
      label: 'Administrator',
      icon: Shield,
      description: 'Platform administrator (requires approval)'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
            Welcome to AfriArt! Please complete your profile to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Wallet Address Display */}
          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <Label className="text-sm text-purple-400">Connected Wallet</Label>
            <p className="text-white font-mono text-sm mt-1">{walletAddress}</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Your Role *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: option.value as any })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.role === option.value
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${
                      formData.role === option.value ? 'text-purple-400' : 'text-gray-400'
                    }`} />
                    <p className="font-semibold text-white mb-1">{option.label}</p>
                    <p className="text-xs text-gray-400">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name * {formData.role === 'artist' && <span className="text-gray-400 text-sm">(Your artist name)</span>}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Enter your display name"
                className="pl-10 bg-gray-800 border-gray-700"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          {/* Bio (only for artists) */}
          {formData.role === 'artist' && (
            <div className="space-y-2">
              <Label htmlFor="bio">Artist Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your artistic journey, style, and inspiration..."
                rows={4}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          )}

          {/* Profile Picture URL */}
          <div className="space-y-2">
            <Label htmlFor="profilePictureUrl">Profile Picture URL (Optional)</Label>
            <Input
              id="profilePictureUrl"
              type="url"
              value={formData.profilePictureUrl}
              onChange={(e) => setFormData({ ...formData, profilePictureUrl: e.target.value })}
              placeholder="https://example.com/your-photo.jpg"
              className="bg-gray-800 border-gray-700"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Social Links (Optional)</Label>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-sm text-gray-400">Twitter</Label>
              <Input
                id="twitter"
                value={formData.socialLinks.twitter}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                })}
                placeholder="@yourhandle or https://twitter.com/yourhandle"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-sm text-gray-400">Instagram</Label>
              <Input
                id="instagram"
                value={formData.socialLinks.instagram}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                })}
                placeholder="@yourhandle or https://instagram.com/yourhandle"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm text-gray-400">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.socialLinks.website}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, website: e.target.value }
                })}
                placeholder="https://yourwebsite.com"
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.role || !formData.displayName.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
