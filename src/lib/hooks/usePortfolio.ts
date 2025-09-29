// src/lib/hooks/usePortfolio.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/supabase';
import { useAuth } from './useAuth';

interface Market {
  id: string;
  title: string;
  category: string;
  points: number;
}

interface Portfolio {
  id: string;
  leagueId: string;
  leagueName?: string;
  userId: string;
  totalPoints: number;
  rank?: number;
  hasJoined: boolean;
  joinedAt: string;
  markets: Market[];
  league?: {
    name: string;
    entryFee: string;
    status: string;
  };
}

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (user) {
      loadPortfolios();
    } else {
      setPortfolios([]);
      setTotalPoints(0);
      setLoading(false);
    }
  }, [user]);

  const loadPortfolios = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load user's portfolios
      const { data: portfoliosData, error: portfolioError } = await supabase
        .from('portfolios')
        .select(`
          *,
          league:leagues!league_id(
            name,
            entry_fee,
            is_active,
            is_resolved
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (portfolioError) throw portfolioError;

      if (portfoliosData) {
        // Load markets for each portfolio
        const portfoliosWithMarkets = await Promise.all(
          portfoliosData.map(async (portfolio) => {
            const { data: portfolioMarkets } = await supabase
              .from('portfolio_markets')
              .select(`
                market:markets!market_id(
                  id,
                  title,
                  category,
                  points
                )
              `)
              .eq('portfolio_id', portfolio.id);

            const markets = portfolioMarkets?.map(pm => ({
              id: pm.market.id,
              title: pm.market.title,
              category: pm.market.category,
              points: pm.market.points,
            })) || [];

            return {
              id: portfolio.id,
              leagueId: portfolio.league_id,
              leagueName: portfolio.league?.name,
              userId: portfolio.user_id,
              totalPoints: portfolio.total_points || 0,
              rank: portfolio.rank,
              hasJoined: portfolio.has_joined,
              joinedAt: portfolio.joined_at || portfolio.created_at,
              markets,
              league: portfolio.league ? {
                name: portfolio.league.name,
                entryFee: portfolio.league.entry_fee.toString(),
                status: portfolio.league.is_resolved ? 'ended' : portfolio.league.is_active ? 'active' : 'upcoming'
              } : undefined
            };
          })
        );

        setPortfolios(portfoliosWithMarkets);
        
        // Calculate total points
        const total = portfoliosWithMarkets.reduce((sum, p) => sum + p.totalPoints, 0);
        setTotalPoints(total);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPortfolios = () => {
    loadPortfolios();
  };

  return {
    portfolios,
    totalPoints,
    loading,
    error,
    refreshPortfolios,
  };
}
