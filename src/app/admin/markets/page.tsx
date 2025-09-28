// src/app/admin/markets/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MarketSync } from '@/components/markets/MarketSync';
import { MarketResolution } from '@/components/admin/MarketResolution';
import { 
  BarChart3, 
  Plus, 
  Search, 
  Filter,
  Zap,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { useSpreadMarketsContract } from '@/lib/blockchain/contracts';
import { supabase } from '@/lib/database/supabase';
import { toast } from '@/components/ui/use-toast';

interface Market {
  id: string;
  contractMarketId: number;
  title: string;
  category: string;
  points: number;
  isResolved: boolean;
  outcome?: boolean;
  kalshiId: string;
  createdAt: string;
  resolutionTime?: string;
}

export default function AdminMarketsPage() {
  const contract = useSpreadMarketsContract();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create market form state
  const [newMarket, setNewMarket] = useState({
    title: '',
    category: 'sports',
    points: 50,
    kalshiId: ''
  });

  useEffect(() => {
    loadMarkets();
  }, []);

  useEffect(() => {
    filterMarkets();
  }, [markets, searchTerm, categoryFilter, statusFilter]);

  const loadMarkets = async () => {
    try {
      const { data: marketsData } = await supabase
        .from('markets')
        .select('*')
        .order('created_at', { ascending: false });

      if (marketsData) {
        const formattedMarkets: Market[] = marketsData.map(market => ({
          id: market.id,
          contractMarketId: market.contract_market_id,
          title: market.title,
          category: market.category,
          points: market.points,
          isResolved: market.is_resolved,
          outcome: market.outcome,
          kalshiId: market.kalshi_id,
          createdAt: market.created_at,
          resolutionTime: market.resolution_time,
        }));
        setMarkets(formattedMarkets);
      }
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMarkets = () => {
    let filtered = markets;

    if (searchTerm) {
      filtered = filtered.filter(market =>
        market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.kalshiId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(market => market.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'resolved') {
        filtered = filtered.filter(market => market.isResolved);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(market => !market.isResolved);
      }
    }

    setFilteredMarkets(filtered);
  };

  const createMarket = async () => {
    if (!contract) return;

    try {
      const tx = await contract.createMarket(
        newMarket.title,
        newMarket.category,
        newMarket.points,
        newMarket.kalshiId
      );
      const receipt = await tx.wait();

      // Update database
      await supabase
        .from('markets')
        .insert({
          title: newMarket.title,
          category: newMarket.category,
          points: newMarket.points,
          kalshi_id: newMarket.kalshiId,
          contract_market_id: receipt.events?.[0]?.args?.marketId || 0,
        });

      toast({
        title: "Market Created",
        description: `${newMarket.title} has been created successfully`,
      });

      setShowCreateForm(false);
      setNewMarket({ title: '', category: 'sports', points: 50, kalshiId: '' });
      await loadMarkets();
    } catch (error) {
      console.error('Error creating market:', error);
      toast({
        title: "Error",
        description: "Failed to create market",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (market: Market) => {
    if (market.isResolved) {
      return (
        <Badge className={`${
          market.outcome 
            ? 'bg-green-500/20 text-green-400 border-green-500/50'
            : 'bg-red-500/20 text-red-400 border-red-500/50'
        }`}>
          {market.outcome ? 'Resolved: YES' : 'Resolved: NO'}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
          Pending
        </Badge>
      );
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sports: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      crypto: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      politics: 'bg-red-500/20 text-red-400 border-red-500/50',
      entertainment: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
      weather: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      other: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-500" />
            Market Management
          </h1>
          <p className="text-gray-400 mt-2">
            Create, sync, and resolve prediction markets
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Market
          </Button>
        </div>
      </div>

      {/* Market Sync Component */}
      <MarketSync />

      {/* Market Resolution Component */}
      <MarketResolution />

      {/* Filters */}
      <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-700 border-dark-600 text-white"
              />
            </div>
          </div>
          
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-dark-700 border-dark-600 text-white"
          >
            <option value="all">All Categories</option>
            <option value="sports">Sports</option>
            <option value="crypto">Crypto</option>
            <option value="politics">Politics</option>
            <option value="entertainment">Entertainment</option>
            <option value="weather">Weather</option>
            <option value="other">Other</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-dark-700 border-dark-600 text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </Select>

          <div className="text-sm text-gray-400">
            {filteredMarkets.length} of {markets.length} markets
          </div>
        </div>
      </Card>

      {/* Create Market Form */}
      {showCreateForm && (
        <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Create New Market</h2>
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="border-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Market Title
              </label>
              <Input
                value={newMarket.title}
                onChange={(e) => setNewMarket({ ...newMarket, title: e.target.value })}
                placeholder="e.g., Will Bitcoin reach $100k by end of 2024?"
                className="bg-dark-700 border-dark-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <Select
                value={newMarket.category}
                onChange={(e) => setNewMarket({ ...newMarket, category: e.target.value })}
                className="bg-dark-700 border-dark-600 text-white"
              >
                <option value="sports">Sports</option>
                <option value="crypto">Crypto</option>
                <option value="politics">Politics</option>
                <option value="entertainment">Entertainment</option>
                <option value="weather">Weather</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Points Value
              </label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={newMarket.points}
                onChange={(e) => setNewMarket({ ...newMarket, points: parseInt(e.target.value) })}
                className="bg-dark-700 border-dark-600 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kalshi ID (Optional)
              </label>
              <Input
                value={newMarket.kalshiId}
                onChange={(e) => setNewMarket({ ...newMarket, kalshiId: e.target.value })}
                placeholder="e.g., BTC-100K-2024"
                className="bg-dark-700 border-dark-600 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={createMarket}
              disabled={!newMarket.title || newMarket.points < 1}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              Create Market
            </Button>
          </div>
        </Card>
      )}

      {/* Markets List */}
      <div className="grid gap-4">
        {filteredMarkets.map((market) => (
          <Card key={market.id} className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{market.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <Badge className={getCategoryColor(market.category)}>
                    {market.category.toUpperCase()}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {market.points} points
                  </span>
                  {market.kalshiId && (
                    <span>Kalshi: {market.kalshiId}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(market.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(market)}
                {market.isResolved && market.resolutionTime && (
                  <span className="text-xs text-gray-500">
                    Resolved: {new Date(market.resolutionTime).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Contract ID: #{market.contractMarketId}
              </div>
              <div className="flex gap-2">
                {!market.isResolved && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // Handle manual resolution - YES
                        // This would call the MarketResolution component functionality
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve YES
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        // Handle manual resolution - NO
                        // This would call the MarketResolution component functionality
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Resolve NO
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredMarkets.length === 0 && (
        <Card className="p-12 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Markets Found</h3>
          <p className="text-gray-400">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first market to get started'
            }
          </p>
        </Card>
      )}
    </div>
  );
}
