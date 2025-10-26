'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Shield,
  Users,
  Image as ImageIcon,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  FileText,
  Eye,
  AlertTriangle,
  BarChart3,
  ShoppingBag,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { statsAPI, userAPI } from '../utils/api';

interface ArtistVerification {
  id: string;
  artistWallet: string;
  displayName: string;
  email: string;
  bio: string;
  profilePictureUrl?: string;
  kycDocuments: {
    idDocument?: string; // IPFS hash
    proofOfAddress?: string; // IPFS hash
    artistStatement?: string; // IPFS hash
  };
  portfolioSamples: string[]; // Array of IPFS hashes
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface PlatformStats {
  totalUsers: number;
  totalArtists: number;
  totalNFTs: number;
  totalSales: number;
  totalVolume: number;
  pendingVerifications: number;
  activeListings: number;
  completedTransactions: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [verifications, setVerifications] = useState<ArtistVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<ArtistVerification | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Route guard - only allow admins
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    // Check if user is admin
    if (user?.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      router.push('/');
      return;
    }

    fetchAdminData();
  }, [isAuthenticated, user, router]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch platform stats
      const statsResponse = await statsAPI.getMarketplaceStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Fetch pending verifications (mock data for now)
      // In production, this would be: await userAPI.getPendingVerifications()
      const mockVerifications: ArtistVerification[] = [
        {
          id: '1',
          artistWallet: '0.0.123456',
          displayName: 'Kwame Mensah',
          email: 'kwame@example.com',
          bio: 'Contemporary African artist specializing in abstract expressionism and mixed media. My work explores themes of identity, heritage, and cultural fusion.',
          profilePictureUrl: '/api/placeholder/100/100',
          kycDocuments: {
            idDocument: 'QmX4z9KvP2wN5hY6tR8jL3mQ9xC1vB4nM7pS2kT6fG8hD5',
            proofOfAddress: 'QmY5a8LqW3oP6iU7rT9kM4nC2xV5bO8pN1mS3lU7gH9iE6',
            artistStatement: 'QmZ6b9MrX4pQ7jV8sU0lN5oD3yW6cP9qO2nT4mV8hI0jF7',
          },
          portfolioSamples: [
            'QmA7c0NsY5qR8kW9tV1mO6pE4zX7dQ0rP3oU5nW9iJ1kG8',
            'QmB8d1OtZ6rS9lX0uW2nP7qF5aY8eR1sQ4pV6oX0jK2lH9',
            'QmC9e2PuA7sT0mY1vX3oQ8rG6bZ9fS2tR5qW7pY1kL3mI0',
          ],
          status: 'pending',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          artistWallet: '0.0.234567',
          displayName: 'Amara Okafor',
          email: 'amara@example.com',
          bio: 'Digital artist and illustrator creating vibrant representations of African folklore and mythology through modern digital techniques.',
          profilePictureUrl: '/api/placeholder/100/100',
          kycDocuments: {
            idDocument: 'QmD0f3QvB8tU1nZ2wY4pR9sH7cA0gT3uS6rX8qZ2lM4nJ1',
            proofOfAddress: 'QmE1g4RwC9uV2oA3xZ5qS0tI8dB1hU4vT7sY9rA3mN5oK2',
          },
          portfolioSamples: [
            'QmF2h5SxD0wW3pB4aA6rT1uJ9eC2iV5wU8tZ0sB4oO6pL3',
            'QmG3i6TyE1xX4qC5bB7sU2vK0fD3jW6xV9uA1tC5pP7qM4',
          ],
          status: 'pending',
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setVerifications(mockVerifications);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId: string) => {
    setProcessingId(verificationId);
    try {
      // In production: await userAPI.approveArtistVerification(verificationId)
      await new Promise(resolve => setTimeout(resolve, 1500));

      setVerifications(prev =>
        prev.map(v =>
          v.id === verificationId
            ? { ...v, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: user?.walletAddress }
            : v
        )
      );

      alert('Artist verification approved successfully!');
      setSelectedVerification(null);
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Failed to approve verification. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (verificationId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setProcessingId(verificationId);
    try {
      // In production: await userAPI.rejectArtistVerification(verificationId, reason)
      await new Promise(resolve => setTimeout(resolve, 1500));

      setVerifications(prev =>
        prev.map(v =>
          v.id === verificationId
            ? { ...v, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: user?.walletAddress }
            : v
        )
      );

      alert('Artist verification rejected.');
      setSelectedVerification(null);
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject verification. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600';
      case 'approved':
        return 'bg-green-600/20 text-green-400 border-green-600';
      case 'rejected':
        return 'bg-red-600/20 text-red-400 border-red-600';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-400">Loading admin dashboard...</h3>
        </div>
      </div>
    );
  }

  const pendingVerifications = verifications.filter(v => v.status === 'pending');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400">Manage platform operations and artist verifications</p>
            </div>
          </div>
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-600 px-4 py-2">
            {user?.walletAddress.slice(0, 6)}...{user?.walletAddress.slice(-4)}
          </Badge>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-400 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="h-12 w-12 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-400 mb-1">Verified Artists</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalArtists || 0}</p>
                </div>
                <Palette className="h-12 w-12 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-900/20 to-pink-800/20 border-pink-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-pink-400 mb-1">Total NFTs</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalNFTs || 0}</p>
                </div>
                <ImageIcon className="h-12 w-12 text-pink-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-400 mb-1">Total Volume</p>
                  <p className="text-3xl font-bold text-white">
                    {stats?.totalVolume?.toLocaleString() || 0} ℏ
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400 mb-1">Active Listings</p>
                  <p className="text-3xl font-bold text-white">{stats?.activeListings || 0}</p>
                </div>
                <ShoppingBag className="h-12 w-12 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border-cyan-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-400 mb-1">Completed Sales</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalSales || 0}</p>
                </div>
                <Activity className="h-12 w-12 text-cyan-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-400 mb-1">Pending Reviews</p>
                  <p className="text-3xl font-bold text-white">{pendingVerifications.length}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/20 border-indigo-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-400 mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-white">{stats?.completedTransactions || 0}</p>
                </div>
                <BarChart3 className="h-12 w-12 text-indigo-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Artist Verifications */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-400" />
              Artist Verifications
              {pendingVerifications.length > 0 && (
                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600 ml-2">
                  {pendingVerifications.length} Pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="pending" className="data-[state=active]:bg-purple-600">
                  Pending ({pendingVerifications.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="data-[state=active]:bg-purple-600">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="data-[state=active]:bg-purple-600">
                  Rejected
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-6">
                {pendingVerifications.length === 0 ? (
                  <Alert className="bg-gray-800 border-gray-700">
                    <AlertDescription className="text-gray-400">
                      No pending verifications at this time.
                    </AlertDescription>
                  </Alert>
                ) : (
                  pendingVerifications.map(verification => (
                    <Card key={verification.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-purple-500">
                              <AvatarImage src={verification.profilePictureUrl} />
                              <AvatarFallback className="bg-purple-600 text-white text-xl">
                                {verification.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-xl font-semibold text-white">{verification.displayName}</h3>
                              <p className="text-sm text-gray-400 font-mono">{verification.artistWallet}</p>
                              <p className="text-sm text-gray-400">{verification.email}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(verification.status)}>
                            {verification.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-400 mb-2">Bio</p>
                            <p className="text-white">{verification.bio}</p>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* KYC Documents */}
                          <div>
                            <p className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              KYC Documents
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {verification.kycDocuments.idDocument && (
                                <a
                                  href={`https://ipfs.io/ipfs/${verification.kycDocuments.idDocument}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                  <FileText className="h-4 w-4 text-blue-400" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium">ID Document</p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {verification.kycDocuments.idDocument.slice(0, 12)}...
                                    </p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-gray-400" />
                                </a>
                              )}
                              {verification.kycDocuments.proofOfAddress && (
                                <a
                                  href={`https://ipfs.io/ipfs/${verification.kycDocuments.proofOfAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                  <FileText className="h-4 w-4 text-green-400" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium">Proof of Address</p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {verification.kycDocuments.proofOfAddress.slice(0, 12)}...
                                    </p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-gray-400" />
                                </a>
                              )}
                              {verification.kycDocuments.artistStatement && (
                                <a
                                  href={`https://ipfs.io/ipfs/${verification.kycDocuments.artistStatement}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                  <FileText className="h-4 w-4 text-purple-400" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium">Artist Statement</p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {verification.kycDocuments.artistStatement.slice(0, 12)}...
                                    </p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-gray-400" />
                                </a>
                              )}
                            </div>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Portfolio Samples */}
                          <div>
                            <p className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Portfolio Samples ({verification.portfolioSamples.length})
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {verification.portfolioSamples.map((ipfsHash, index) => (
                                <a
                                  key={index}
                                  href={`https://ipfs.io/ipfs/${ipfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative aspect-square bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                                >
                                  <img
                                    src={`https://ipfs.io/ipfs/${ipfsHash}`}
                                    alt={`Portfolio sample ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = '/api/placeholder/200/200';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="h-8 w-8 text-white" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>

                          <Separator className="bg-gray-700" />

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-gray-400">
                              Submitted {formatDate(verification.submittedAt)}
                            </p>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleReject(verification.id)}
                                variant="outline"
                                className="border-red-700 text-red-400 hover:bg-red-900/20"
                                disabled={processingId === verification.id}
                              >
                                {processingId === verification.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleApprove(verification.id)}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                disabled={processingId === verification.id}
                              >
                                {processingId === verification.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <Alert className="bg-gray-800 border-gray-700">
                  <AlertDescription className="text-gray-400">
                    Showing approved artist verifications. ({verifications.filter(v => v.status === 'approved').length} total)
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <Alert className="bg-gray-800 border-gray-700">
                  <AlertDescription className="text-gray-400">
                    Showing rejected artist verifications. ({verifications.filter(v => v.status === 'rejected').length} total)
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
