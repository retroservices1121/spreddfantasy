// src/lib/hooks/useLeagues.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useAuth } from './useAuth';

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
  status: 'active' | 'ended' | 'upcoming';
  creator: {
    username: string;
    walletAddress: string;
  };
}

interface UseLeaguesOptions {
  userOnly?: boolean;
  limit?: number;
  status?: string;
}

export function useLeagues(options: UseLeaguesOptions = {}) {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadLeagues();
  }, [user, options.userOnly, options.limit, options.status]);

  const loadLeagues = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leagues')
        .select(`
          *,
          creator:users!creator_id(username, wallet_address)
        `)
        .order('created_at', { ascending: false });

      // Filter by user's leagues if userOnly
      if (options.userOnly && user) {
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

      // Filter by status
      if (options.status) {
        if (options.status === 'active') {
          query = query.eq('is_active', true).eq('is_resolved', false);
        } else if (options.status === 'ended') {
          query = query.eq('is_resolved', true);
        }
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: leaguesData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

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
          startTime: league.start_time,
          endTime: league.end_time,
          isActive: league.is_active,
          isResolved: league.is_resolved,
          status: getLeagueStatus(league),
          creator: {
            username: league.creator?.username || 'Unknown',
            walletAddress: league.creator?.wallet_address || ''
          }
        }));
        
        setLeagues(formattedLeagues);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading leagues:', err);
    } finally {
      setLoading(false);
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

  const refreshLeagues = () => {
    loadLeagues();
  };

  return {
    leagues,
    loading,
    error,
    refreshLeagues,
  };
}
