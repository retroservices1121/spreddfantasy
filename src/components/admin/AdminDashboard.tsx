// src/components/admin/AdminDashboard.tsx (Complete export default version)
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
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Pause,
  Play,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface LeagueType {
  type: string;
  fee: string;
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

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [leagueTypes, setLeagueTypes] = useState<LeagueType[]>([
    { type: 'daily', fee: '5.00', allowed: true },
    { type: 'weekly', fee: '10.00', allowed: true },
    { type: 'monthly', fee: '25.00', allowed: true },
  ]);
  
  const [adminStats] = useState<AdminStats>({
    totalLeagues: 25,
    totalParticipants: 847,
    totalRevenue: '12,450.75',
    activeMarkets: 156,
    platformFee: '5',
    contractBalance: '5,230.50'
  });
  
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newFee, setNewFee] = useState('');
  const [platformFee, setPlatformFee] = useState('5');
  const [loading, setLoading] = useState(false);
  const [contractPaused, setContractPaused] = useState(false);

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

      {/* Entry Fee Management */}
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
                      onClick={() => {
                        // Update fee logic here
                        setEditingType(null);
                      }}
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

      {/* Platform Settings */}
      <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold text-white">Platform Settings</h2>
        </div>
        
        <div className="space-y-6">
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
                onClick={() => {}}
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
        </div>
      </Card>
    </div>
  );
}
