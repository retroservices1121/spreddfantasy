import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/database/supabase';

export interface User {
  id: string;
  privyId: string;
  walletAddress?: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
}

export function useAuth() {
  const { user: privyUser, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authenticated && privyUser) {
      syncUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [authenticated, privyUser, address]);

  const syncUser = async () => {
    if (!privyUser) return;

    try {
      // Check if user exists in database
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('privy_id', privyUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const userData = {
        privy_id: privyUser.id,
        wallet_address: address || privyUser.wallet?.address,
        email: privyUser.email?.address,
        username: privyUser.username || privyUser.email?.address?.split('@')[0],
        avatar_url: privyUser.google?.profilePictureUrl || privyUser.twitter?.profilePictureUrl,
      };

      if (existingUser) {
        // Update existing user
        const { data, error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setUser(mapUser(data));
      } else {
        // Create new user
        const { data, error: insertError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (insertError) throw insertError;
        setUser(mapUser(data));
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapUser = (data: any): User => ({
    id: data.id,
    privyId: data.privy_id,
    walletAddress: data.wallet_address,
    email: data.email,
    username: data.username,
    avatarUrl: data.avatar_url,
  });

  return {
    user,
    authenticated,
    loading,
    login,
    logout,
  };
}
