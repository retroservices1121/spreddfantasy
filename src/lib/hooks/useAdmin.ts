// src/lib/hooks/useAdmin.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSpreadMarketsContract } from '@/lib/blockchain/contracts';
import { supabase } from '@/lib/database/supabase';
import { formatUnits } from 'ethers';

interface AdminStats {
  totalLeagues: number;
  totalParticipants: number;
  totalRevenue: string;
  activeMarkets: number;
  platformFee: string;
  contractBalance: string;
  pendingResolutions: number;
}

interface AdminActivity {
  id: string;
  action: string;
  timestamp: string;
  adminId: string;
  details?: string;
  transactionHash?: string;
}

export function useAdmin() {
  const { user } = useAuth();
  const contract = useSpreadMarketsContract();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);

  useEffect(() => {
    checkAdminStatus();
  }, [user, contract]);

  const checkAdminStatus = async () => {
    if (!user || !contract) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is contract owner
      const owner = await contract.owner();
      const userIsAdmin = user.walletAddress?.toLowerCase() === owner.toLowerCase();
      setIsAdmin(userIsAdmin);

      if (userIsAdmin) {
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    if (!contract) return;

    try {
      // Load contract stats
      const [leagueCount, marketCount] = await contract.getCounts();
      const platformFeePercentage = await contract.platformFeePercentage();
      
      // Load database stats
      const { data: leaguesData } = await supabase
        .from('leagues')
        .select('id, current_participants, total_prize_pool');

      const { data: marketsData } = await supabase
        .from('markets')
        .select('id', { count: 'exact' })
        .eq('is_resolved', false);

      const totalParticipants = leaguesData?.reduce((sum, league) => 
        sum + (league.current_participants || 0), 0) || 0;
      
      const totalRevenue = leaguesData?.reduce((sum, league) => 
        sum + parseFloat(league.total_prize_pool || '0'), 0) || 0;

      setStats({
        totalLeagues: Number(leagueCount),
        totalParticipants,
        totalRevenue: totalRevenue.toFixed(2),
        activeMarkets: marketsData?.length || 0,
        platformFee: (Number(platformFeePercentage) / 100).toString(),
        contractBalance: '0', // Would need to query USDC balance
        pendingResolutions: 0, // Would need to query pending markets
      });

      await loadAdminActivities();
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const loadAdminActivities = async () => {
    try {
      const { data } = await supabase
        .from('admin_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setActivities(data.map(activity => ({
          id: activity.id,
          action: activity.action,
          timestamp: activity.created_at,
          adminId: activity.admin_id,
          details: activity.details,
          transactionHash: activity.transaction_hash,
        })));
      }
    } catch (error) {
      console.error('Error loading admin activities:', error);
    }
  };

  const logActivity = async (action: string, details?: string, transactionHash?: string) => {
    if (!user) return;

    try {
      await supabase
        .from('admin_activities')
        .insert({
          action,
          admin_id: user.id,
          details,
          transaction_hash: transactionHash,
        });

      await loadAdminActivities();
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  };

  return {
    isAdmin,
    loading,
    stats,
    activities,
    loadAdminData,
    logActivity,
  };
}
