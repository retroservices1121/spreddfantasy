'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Pause,
  Play,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useSpreadMarketsContract } from '@/lib/blockchain/contracts';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { formatUnits, parseUnits } from 'ethers';

interface LeagueType {
  type: string;
  fee: string; // USDC amount
  allowed: boolean;
}

interface AdminStats {
  totalLeagues: number;
  totalParticipants: number;
  totalRevenue: string;
  activeMarkets: number;
  platformFee: string;
  contractBalance: string;
}

interface RecentActivity {
  id: string;
  action: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
  details?: string;
}

interface League {
  id: string;
  name: string;
  type: string;
  participants: number;
  maxParticipants: number;
  entryFee: string;
  prizePool: string;
  status: 'active' | 'ended' | 'upcoming';
  endTime: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const contract = useSpreadMarketsContract();
  
  const [leagueTypes, setLeagueTypes] = useState<LeagueType[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalLeagues: 0,
    totalParticipants: 0,
    totalRevenue: '0',
    activeMarkets: 0,
    platformFee: '5',
    contractBalance: '0'
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentLeagues, setRecentLeagues] = useState<League[]>([]);
  
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newFee, setNewFee] = useState('');
  const [platformFee, setPlatformFee] = useState('5');
  const [loading, setLoading] = useState(false);
  const [contractPaused, setContractPaused] = useState(false);

  // Load initial data
  useEffect(() => {
    loadLeagueTypes();
    loadAdminStats();
    loadRecentActivity();
    loadRecentLeagues();
    checkContractStatus();
  }, [contract]);

  const loadLeagueTypes = async () => {
    if (!contract) return;
    
    try {
      const [types, fees, allowed] = await contract.getLeagueTypes();
      const formattedTypes: LeagueType[] = types.map((type: string, index: number) => ({
        type,
        fee: formatUnits(fees[index], 6), // USDC has 6 decimals
        allowed: allowed[index]
      }));
      setLeagueTypes(formattedTypes);
    } catch (error) {
      console.error('Error loading league types:', error);
      toast({
        title: "Error",
        description: "Failed to load league types",
        variant: "destructive",
      });
    }
  };

  const loadAdminStats = async () => {
    if (!contract) return;
    
    try {
      // Load platform fee
      const platformFeePercentage = await contract.platformFeePercentage();
      const feePercentage = (Number(platformFeePercentage) / 100).toString();
      
      // Load other stats from contract or API
      setAdminStats({
        totalLeagues: 25,
        totalParticipants: 847,
        totalRevenue: '12,450.75',
        activeMarkets: 156,
        platformFee: feePercentage,
        contractBalance: '5,230.50'
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    // This would typically come from your backend API or contract events
    setRecentActivity([
      {
        id: '1',
        action: 'Updated daily league entry fee to $5.00 USDC',
        time: '2 hours ago',
        status: 'success',
        details: 'Entry fee changed from $3.00 to $5.00'
      },
      {
        id: '2',
        action: 'Resolved 15 markets from Kalshi sync',
        time: '4 hours ago',
        status: 'success',
        details: 'Markets automatically resolved based on Kalshi outcomes'
      },
      {
        id: '3',
        action: 'Created new weekly league: "Crypto Predictions Weekly"',
        time: '1 day ago',
        status: 'info',
        details: 'Max participants: 100, Entry fee: $10 USDC'
      },
      {
        id: '4',
        action: 'Platform fee updated to 5%',
        time: '2 days ago',
        status: 'warning',
        details: 'Platform fee changed from 3% to 5%'
      },
      {
        id: '5',
        action: 'Emergency pause activated',
        time: '3 days ago',
        status: 'error',
        details: 'Contract paused due to security concern - later resolved'
      }
    ]);
  };

  const loadRecentLeagues = async () => {
    // This would typically come from your backend API
    setRecentLeagues([
      {
        id: '1',
        name: 'Weekend Warriors',
        type: 'daily',
        participants: 45,
        maxParticipants: 50,
        entryFee: '5.00',
        prizePool: '225.00',
        status: 'active',
        endTime: '2025-09-28T18:00:00Z'
      },
      {
        id: '2',
        name: 'Crypto Weekly Championship',
        type: 'weekly',
        participants: 78,
        maxParticipants: 100,
        entryFee: '10.00',
        prizePool: '780.00',
        status: 'active',
        endTime: '2025-10-04T18:00:00Z'
      },
      {
        id: '3',
        name: 'Monthly Masters',
        type: 'monthly',
        participants: 23,
        maxParticipants: 50,
        entryFee: '25.00',
        prizePool: '575.00',
        status: 'active',
        endTime: '2025-10-27T18:00:00Z'
      }
    ]);
  };

  const checkContractStatus = async () => {
    if (!contract) return;
    
    try {
      const paused = await contract.paused();
      setContractPaused(paused);
    } catch (error) {
      console.error('Error checking contract status:', error);
    }
  };

  const updateEntryFee = async (leagueType: string, newFeeAmount: string) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const feeInWei = parseUnits(newFeeAmount, 6); // USDC has 6 decimals
      const tx = await contract.setEntryFee(leagueType, feeInWei);
      await tx.wait();
      
      toast({
        title: "Success",
        description: `Entry fee updated for ${leagueType} leagues`,
      });
      
      await loadLeagueTypes();
      setEditingType(null);
      setNewFee('');
      
      // Add to recent activity
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        action: `Updated ${leagueType} league entry fee to $${newFeeAmount} USDC`,
        time: 'Just now',
        status: 'success',
        details: `Entry fee changed to $${newFeeAmount}`
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error('Error updating entry fee:', error);
      toast({
        title: "Error",
        description: "Failed to update entry fee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlatformFee = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const feeInBasisPoints = parseInt(platformFee) * 100; // Convert percentage to basis points
      const tx = await contract.setPlatformFeePercentage(feeInBasisPoints);
      await tx.wait();
      
      toast({
        title: "Success",
        description: `Platform fee updated to ${platformFee}%`,
      });
      
      await loadAdminStats();
      
      // Add to recent activity
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        action: `Platform fee updated to ${platformFee}%`,
        time: 'Just now',
        status: 'warning',
        details: `Platform fee changed to ${platformFee}%`
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error('Error updating platform fee:', error);
      toast({
        title: "Error",
        description: "Failed to update platform fee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLeagueType = async (leagueType: string, enabled: boolean) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.setLeagueTypeStatus(leagueType, enabled);
      await tx.wait();
      
      toast({
        title: "Success",
        description: `${leagueType} leagues ${enabled ? 'enabled' : 'disabled'}`,
      });
      
      await loadLeagueTypes();
      
      // Add to recent activity
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        action: `${enabled ? 'Enabled' : 'Disabled'} ${leagueType} league type`,
        time: 'Just now',
        status: enabled ? 'success' : 'warning',
        details: `${leagueType} leagues are now ${enabled ? 'available' : 'disabled'}`
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error('Error toggling league type:', error);
      toast({
        title: "Error",
        description: "Failed to update league type status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleContractPause = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = contractPaused ? await contract.unpause() : await contract.pause();
      await tx.wait();
      
      const newStatus = !contractPaused;
      setContractPaused(newStatus);
      
      toast({
        title: "Success",
        description: `Contract ${newStatus ? 'paused' : 'unpaused'} successfully`,
      });
      
      // Add to recent activity
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        action: `Contract ${newStatus ? 'paused' : 'unpaused'}`,
        time: 'Just now',
        status: newStatus ? 'error' : 'success',
        details: `All contract functions are now ${newStatus ? 'paused' : 'active'}`
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error('Error toggling contract pause:', error);
      toast({
        title: "Error",
        description: "Failed to update contract status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <X className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'ended': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const statsCards = [
    {
      title: 'Total Leagues',
      value: adminStats.totalLeagues,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Total Participants',
      value: adminStats.totalParticipants.toLocaleString(),
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
    },
    {
      title: 'Total Revenue',
      value: `$${adminStats.totalRevenue}`,
      icon: DollarSign,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10 border-primary-500/20',
    },
    {
      title: 'Active Markets',
      value: adminStats.activeMarkets,
      icon: Clock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary-500" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Manage platform settings, entry fees, and league configurations
          </p>
        </div>
  );
}

// Export default
export default AdminDashboard;
        <div className="flex gap-3">
          <Button 
            onClick={() => window.location.href = '/admin/markets'}
            variant="outline"
            className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Manage Markets
          </Button>
          <Button 
            onClick={() => window.location.href = '/admin/leagues'}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            <Eye className="w-4 h-4 mr-2" />
            View All Leagues
          </Button>
        </div>
      </div>

      {/* Contract Status Alert */}
      {contractPaused && (
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">Contract Paused</h3>
              <p className="text-sm text-red-300">All contract functions are currently paused. Users cannot join leagues or make predictions.</p>
            </div>
            <Button 
              onClick={toggleContractPause}
              disabled={loading}
              className="ml-auto bg-red-600 hover:bg-red-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Unpause Contract
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className={`p-6 ${stat.bgColor} border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entry Fee Management */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-bold text-white">League Entry Fees (USDC)</h2>
            </div>
            
            <div className="space-y-4">
              {leagueTypes.map((leagueType) => (
                <div key={leagueType.type} className="border border-dark-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white capitalize">
                        {leagueType.type} Leagues
                      </h3>
                      <Badge 
                        className={leagueType.allowed 
                          ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                          : 'bg-red-500/20 text-red-400 border-red-500/50'
                        }
                      >
                        {leagueType.allowed ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleLeagueType(leagueType.type, !leagueType.allowed)}
                      disabled={loading}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {leagueType.allowed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {editingType === leagueType.type ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newFee}
                          onChange={(e) => setNewFee(e.target.value)}
                          placeholder="Enter USDC amount"
                          className="bg-dark-700 border-dark-600 text-white flex-1"
                        />
                        <span className="text-gray-400 text-sm">USDC</span>
                        <Button
                          size="sm"
                          onClick={() => updateEntryFee(leagueType.type, newFee)}
                          disabled={loading || !newFee}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingType(null);
                            setNewFee('');
                          }}
                          className="border-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary-400">
                            ${leagueType.fee}
                          </span>
                          <span className="text-gray-400 text-sm">USDC</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingType(leagueType.type);
                            setNewFee(leagueType.fee);
                          }}
                          className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Platform Configuration */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-bold text-white">Platform Settings</h2>
            </div>
            
            <div className="space-y-6">
              {/* Platform Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Platform Fee Percentage
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="bg-dark-700 border-dark-600 text-white"
                  />
                  <span className="text-gray-400">%</span>
                  <Button
                    onClick={updatePlatformFee}
                    disabled={loading}
                    size="sm"
                    className="bg-primary-500 hover:bg-primary-600"
                  >
                    Update
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 10%. This fee is deducted from entry fees before adding to prize pool.
                </p>
              </div>

              {/* Contract Controls */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white">Contract Controls</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={toggleContractPause}
                    disabled={loading}
                    className={contractPaused 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-yellow-600 hover:bg-yellow-700"
                    }
                  >
                    {contractPaused ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Unpause Contract
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Contract
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    onClick={() => window.location.href = '/admin/sync'}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Markets
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Contract Info */}
          <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
            <h3 className="font-semibold text-white mb-4">Contract Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-white">Base Mainnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">USDC Token:</span>
                <span className="text-white font-mono text-xs">
                  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Contract:</span>
                <span className="text-white font-mono text-xs">
                  {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'Not Deployed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Balance:</span>
                <span className="text-white">${adminStats.contractBalance} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={contractPaused ? 'text-red-400' : 'text-green-400'}>
                  {contractPaused ? 'Paused' : 'Active'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity & Leagues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary-500" />
            Recent Admin Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 bg-dark-700/50 rounded-lg">
                {getActivityIcon(activity.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{activity.action}</p>
                  <p className="text-gray-500 text-xs">{activity.time}</p>
                  {activity.details && (
                    <p className="text-gray-400 text-xs mt-1">{activity.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Leagues */}
        <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Recent Leagues
          </h2>
          <div className="space-y-4">
            {recentLeagues.map((league) => (
              <div key={league.id} className="border border-dark-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{league.name}</h3>
                  <Badge className={getStatusColor(league.status)}>
                    {league.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white ml-2 capitalize">{league.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Entry:</span>
                    <span className="text-white ml-2">${league.entryFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Participants:</span>
                    <span className="text-white ml-2">{league.participants}/{league.maxParticipants}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Prize Pool:</span>
                    <span className="text-white ml-2">${league.prizePool}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button 
            className="w-full mt-4 border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
            variant="outline"
            onClick={() => window.location.href = '/admin/leagues'}
          >
            View All Leagues
          </Button>
        </Card>
      </div>
    </div>
