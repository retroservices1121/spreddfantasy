// src/components/leagues/LeagueList.tsx
'use client';

import { useState, useEffect } from 'react';
import { LeagueCard } from './LeagueCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Trophy } from 'lucide-react';
import { supabase } from '@/lib/database/supabase';
import { useAuth } from '@/lib/hooks/useAuth';

interface League {
  id: string;
  name: string;
  description: string;
  leagueType: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  totalPrizePool: string;
  endTime: string;
  status: 'active' | 'ended' | 'upcoming';
  creator: {
    username: string;
  };
}

interface LeagueListProps {
  showCreateButton?: boolean;
  userOnly?: boolean;
  limit?: number;
}

export function LeagueList({ showCreateButton = true, userOnly = false, limit }: LeagueListProps) {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userLeagues, setUserLeagues] = useState<string[]>([]);

  useEffect(() => {
    loadLeagues();
    if (user) {
      loadUserLeagues();
    }
  }, [user, userOnly]);

  useEffect(() => {
    filterLeagues();
  }, [leagues, searchTerm, typeFilter, statusFilter]);

  const loadLeagues = async () => {
    try {
      let query = supabase
        .from('leagues')
        .select(`
          *,
          creator:users!creator_id(username)
        `)
        .order('created_at', { ascending: false });

      if (userOnly && user) {
        // Get leagues where user is a participant
        const { data: portfolios } = await supabase
          .from('portfolios')
          .select('league_id')
          .eq('user_id', user.id);
        
        const leagueIds = portfolios?.map(p => p.league_id) || [];
        if (leagueIds.length > 0) {
          query = query.in('id', leagueIds);
        } else {
          setLeagues([]);
          setLoading(false);
          return;
        }
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: leaguesData, error } = await query;

      if (error) {
        console.error('Error loading leagues:', error);
        return;
      }

      if (leaguesData) {
        const formattedLeagues: League[] = leaguesData.map(league => ({
          id: league.id,
          name: league.name,
          description: league.description || '',
          leagueType: league.league_type,
          entryFee: league.entry_fee.toString(),
          maxParticipants: league.max_participants,
          currentParticipants: league.current_participants,
          totalPrizePool: league.total_prize_pool.toString(),
          endTime: league.end_time,
          status: getLeagueStatus(league),
          creator: {
            username: league.creator?.username || 'Unknown'
          }
        }));
        
        setLeagues(formattedLeagues);
      }
    } catch (error) {
      console.error('Error loading leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLeagues = async () => {
    if (!user) return;

    try {
      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('league_id')
        .eq('user_id', user.id);

      const leagueIds = portfolios?.map(p => p.league_id) || [];
      setUserLeagues(leagueIds);
    } catch (error) {
      console.error('Error loading user leagues:', error);
    }
  };

  const getLeagueStatus = (league: any): 'active' | 'ended' | 'upcoming' => {
    const now = new Date();
    const endTime = new Date(league.end_time);
    const startTime = new Date(league.start_time);

    if (league.is_resolved) return 'ended';
    if (now > endTime) return 'ended';
    if (now < startTime) return 'upcoming';
    return 'active';
  };

  const filterLeagues = () => {
    let filtered = leagues;

    if (searchTerm) {
      filtered = filtered.filter(league =>
        league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        league.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(league => league.leagueType === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(league => league.status === statusFilter);
    }

    setFilteredLeagues(filtered);
  };

  const handleJoinLeague = async (leagueId: string) => {
    // This would typically open a modal for market selection
    console.log('Joining league:', leagueId);
    // Implementation would go here
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-dark-800 rounded-lg h-64"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showCreateButton && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {userOnly ? 'Your Leagues' : 'Available Leagues'}
            </h2>
            <p className="text-gray-400">
              {userOnly 
                ? 'Leagues you\'ve joined and are participating in'
                : 'Join fantasy prediction leagues and compete for USDC prizes'
              }
            </p>
          </div>
          {!userOnly && (
            <Button
              onClick={() => window.location.href = '/admin'}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create League
            </Button>
          )}
        </div>
      )}

      {/* Filters */}
      {!userOnly && (
        <Card className="p-4 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search leagues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-dark-700 border-dark-600 text-white"
                />
              </div>
            </div>
            
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-dark-700 border-dark-600 text-white"
            >
              <option value="all">All Types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-700 border-dark-600 text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="ended">Ended</option>
            </Select>

            <div className="text-sm text-gray-400">
              {filteredLeagues.length} of {leagues.length} leagues
            </div>
          </div>
        </Card>
      )}

      {/* Leagues Grid */}
      {filteredLeagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeagues.map((league) => (
            <LeagueCard
              key={league.id}
              league={league}
              onJoin={handleJoinLeague}
              isJoined={userLeagues.includes(league.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {userOnly ? 'No Leagues Joined' : 'No Leagues Found'}
          </h3>
          <p className="text-gray-400">
            {userOnly 
              ? 'Join your first league to start playing!'
              : searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Be the first to create a league!'
            }
          </p>
          {userOnly && (
            <Button 
              onClick={() => window.location.href = '/leagues'}
              className="mt-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              Browse Available Leagues
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
