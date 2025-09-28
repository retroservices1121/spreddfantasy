'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useLeagues } from '@/lib/hooks/useLeagues';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeagueCard } from '@/components/leagues/LeagueCard';
import { WalletConnect } from '@/components/auth/WalletConnect';
import { PortfolioOverview } from '@/components/portfolio/PortfolioOverview';
import { TrendingUp, Trophy, DollarSign, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user, authenticated, loading } = useAuth();
  const { leagues, loading: leaguesLoading } = useLeagues({ userOnly: true });
  const { portfolios, totalPoints } = usePortfolio();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to SpreadMarkets
          </h1>
          <p className="text-gray-400 mb-8">
            Connect your wallet or sign in to start playing fantasy prediction markets
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Points',
      value: totalPoints.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Active Leagues',
      value: leagues?.filter(l => l.status === 'active').length || 0,
      icon: Trophy,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10 border-primary-500/20',
    },
    {
      label: 'Total Invested',
      value: `${portfolios?.reduce((sum, p) => sum + (p.league?.entryFee || 0), 0).toFixed(3)} ETH`,
      icon: DollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Best Rank',
      value: Math.min(...(portfolios?.map(p => p.rank || 999) || [999])) === 999 ? 'N/A' : `#${Math.min(...(portfolios?.map(p => p.rank || 999) || [999]))}`,
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
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.username || 'Player'}!
          </h1>
          <p className="text-gray-400 mt-2">
            Track your performance and join new leagues
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => window.location.href = '/leagues'}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            Browse Leagues
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/markets'}
            className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
          >
            View Markets
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`p-6 ${stat.bgColor} border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Portfolio Overview */}
      <PortfolioOverview portfolios={portfolios} />

      {/* Active Leagues */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Your Active Leagues</h2>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/leagues'}
            className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
          >
            View All Leagues
          </Button>
        </div>

        {leaguesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-dark-800 rounded-lg h-64"></div>
              </div>
            ))}
          </div>
        ) : leagues && leagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.slice(0, 6).map((league) => {
              const userPortfolio = portfolios?.find(p => p.leagueId === league.id);
              return (
                <LeagueCard
                  key={league.id}
                  league={league}
                  onJoin={() => {}}
                  isJoined={!!userPortfolio}
                  userRank={userPortfolio?.rank}
                />
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
            <div className="max-w-md mx-auto">
              <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Active Leagues
              </h3>
              <p className="text-gray-400 mb-6">
                Join your first league to start playing fantasy prediction markets
              </p>
              <Button 
                onClick={() => window.location.href = '/leagues'}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                Browse Available Leagues
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
