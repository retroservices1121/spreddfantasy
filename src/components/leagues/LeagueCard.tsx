'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, DollarSign, Trophy } from 'lucide-react';
import { League } from '@/lib/types/leagues';
import { formatDistanceToNow } from 'date-fns';

interface LeagueCardProps {
  league: League;
  onJoin: (leagueId: string) => void;
  isJoined?: boolean;
  userRank?: number;
}

export function LeagueCard({ league, onJoin, isJoined, userRank }: LeagueCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'ended':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-primary-500/20 text-primary-400 border-primary-500/50';
      case 'weekly':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'monthly':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700 hover:border-primary-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{league.name}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{league.description}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getStatusColor(league.status)}>
              {league.status.toUpperCase()}
            </Badge>
            <Badge className={getTypeColor(league.leagueType)}>
              {league.leagueType.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-300">
            <DollarSign className="w-4 h-4 text-primary-500" />
            <span className="text-sm">
              {league.entryFee > 0 ? `${league.entryFee} ETH` : 'Free'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="w-4 h-4 text-primary-500" />
            <span className="text-sm">
              {league.currentParticipants}/{league.maxParticipants}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span className="text-sm">
              Ends {formatDistanceToNow(new Date(league.endTime), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Trophy className="w-4 h-4 text-primary-500" />
            <span className="text-sm">
              {league.totalPrizePool > 0 ? `${league.totalPrizePool} ETH` : 'TBD'}
            </span>
          </div>
        </div>

        {isJoined && userRank && (
          <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-primary-400">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">
                You're ranked #{userRank}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {!isJoined ? (
            <Button
              onClick={() => onJoin(league.id)}
              disabled={league.status !== 'active' || league.currentParticipants >= league.maxParticipants}
              className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              {league.currentParticipants >= league.maxParticipants ? 'Full' : 'Join League'}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1 border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
              onClick={() => {
                // Navigate to league details
                window.location.href = `/leagues/${league.id}`;
              }}
            >
              View Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
