// src/app/admin/leagues/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { useSpreadMarketsContract } from '@/lib/blockchain/contracts';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface League {
  id: string;
  name: string;
  description: string;
  leagueType: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  totalPrizePool: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isResolved: boolean;
  creator: {
    username: string;
    walletAddress: string;
  };
}

export default function AdminLeaguesPage() {
  const contract = useSpreadMarketsContract();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadLeagues();
  }, []);

  const loadLeagues = async () => {
    try {
      const { data: leaguesData } = await supabase
        .from('leagues')
        .select(`
          *,
          creator:users!creator_id(username, wallet_address)
        `)
        .order('created_at', { ascending: false });

      if (leaguesData) {
        const formattedLeagues: League[] = leaguesData.map(league => ({
          id: league.id,
          name: league.name,
          description: league.description,
          leagueType: league.league_type,
          entryFee: league.entry_fee.toString(),
          maxParticipants: league.max_participants,
          currentParticipants: league.current_participants,
          totalPrizePool: league.total_prize_pool.toString(),
          startTime: league.start_time,
          endTime: league.end_time,
          isActive: league.is_active,
          isResolved: league.is_resolved,
          creator: {
            username: league.creator?.username || 'Unknown',
            walletAddress: league.creator?.wallet_address || '',
          },
        }));
        setLeagues(formattedLeagues);
      }
    } catch (error) {
      console.error('Error loading leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (league: League) => {
    if (league.isResolved) {
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
          Completed
        </Badge>
      );
    } else if (league.isActive && new Date() < new Date(league.endTime)) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
          Active
        </Badge>
      );
    } else if (new Date() >= new Date(league.endTime)) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
          Ended - Pending Resolution
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
          Upcoming
        </Badge>
      );
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      daily: 'bg-primary-500/20 text-primary-400 border-primary-500/50',
      weekly: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      monthly: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    };
    return colors[type] || colors.daily;
  };

  const resolveLeague = async (leagueId: string) => {
    if (!contract) return;

    try {
      // Get contract league ID from database
      const { data: league } = await supabase
        .from('leagues')
        .select('contract_league_id')
        .eq('id', leagueId)
        .single();

      if (!league?.contract_league_id) {
        throw new Error('Contract league ID not found');
      }

      const tx = await contract.resolveLeague(league.contract_league_id);
      await tx.wait();

      // Update database
      await supabase
        .from('leagues')
        .update({ is_resolved: true })
        .eq('id', leagueId);

      toast({
        title: "League Resolved",
        description: "Prizes have been distributed to winners",
      });

      await loadLeagues();
    } catch (error) {
      console.error('Error resolving league:', error);
      toast({
        title: "Error",
        description: "Failed to resolve league",
        variant: "destructive",
      });
    }
  };

  const filteredLeagues = leagues.filter(league => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return league.isActive && !league.isResolved;
    if (statusFilter === 'completed') return league.isResolved;
    if (statusFilter === 'pending') return !league.isActive && !league.isResolved;
    return true;
  });

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
            <Trophy className="w-8 h-8 text-primary-500" />
            League Management
          </h1>
          <p className="text-gray-400 mt-2">
            Monitor and manage all prediction leagues
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-dark-700 border border-dark-600 text-white rounded px-3 py-2"
          >
            <option value="all">All Leagues</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending Resolution</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Leagues</p>
              <p className="text-2xl font-bold text-blue-400">{leagues.length}</p>
            </div>
            <Trophy className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-6 bg-green-500/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Active Leagues</p>
              <p className="text-2xl font-bold text-green-400">
                {leagues.filter(l => l.isActive && !l.isResolved).length}
              </p>
            </div>
            <Play className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-6 bg-primary-500/10 border-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Participants</p>
              <p className="text-2xl font-bold text-primary-400">
                {leagues.reduce((sum, l) => sum + l.currentParticipants, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-primary-400" />
          </div>
        </Card>

        <Card className="p-6 bg-purple-500/10 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Prize Pool</p>
              <p className="text-2xl font-bold text-purple-400">
                ${leagues.reduce((sum, l) => sum + parseFloat(l.totalPrizePool), 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Leagues List */}
      <div className="grid gap-6">
        {filteredLeagues.map((league) => (
          <Card key={league.id} className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-white">{league.name}</h3>
                  {getStatusBadge(league)}
                  <Badge className={getTypeColor(league.leagueType)}>
                    {league.leagueType.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-400 mb-3">{league.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-400">Entry:</span>
                    <span className="text-white">${league.entryFee} USDC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-400">Participants:</span>
                    <span className="text-white">{league.currentParticipants}/{league.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-400">Prize Pool:</span>
                    <span className="text-white">${league.totalPrizePool} USDC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-400">Ends:</span>
                    <span className="text-white">
                      {formatDistanceToNow(new Date(league.endTime), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  Created by: {league.creator.username}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
                  onClick={() => window.location.href = `/leagues/${league.id}`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                
                {!league.isResolved && new Date() >= new Date(league.endTime) && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => resolveLeague(league.id)}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Resolve League
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Participation</span>
                <span>{Math.round((league.currentParticipants / league.maxParticipants) * 100)}% Full</span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(league.currentParticipants / league.maxParticipants) * 100}%` }}
                ></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredLeagues.length === 0 && (
        <Card className="p-12 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Leagues Found</h3>
          <p className="text-gray-400">
            {statusFilter === 'all' 
              ? 'No leagues have been created yet' 
              : `No ${statusFilter} leagues found`
            }
          </p>
        </Card>
      )}
    </div>
  );
}
