// src/components/admin/MarketResolution.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, Clock, ExternalLink } from 'lucide-react';
import { useSpreadMarketsContract } from '@/lib/blockchain/contracts';
import { kalshiAPI } from '@/lib/integrations/kalshi';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/database/supabase';

interface PendingMarket {
  id: string;
  contractMarketId: number;
  title: string;
  category: string;
  kalshiId: string;
  points: number;
  createdAt: string;
  kalshiStatus?: string;
  kalshiOutcome?: boolean;
}

export function MarketResolution() {
  const contract = useSpreadMarketsContract();
  const [pendingMarkets, setPendingMarkets] = useState<PendingMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    loadPendingMarkets();
  }, []);

  const loadPendingMarkets = async () => {
    try {
      const { data: markets } = await supabase
        .from('markets')
        .select('*')
        .eq('is_resolved', false)
        .not('kalshi_id', 'is', null);

      if (markets) {
        const marketsWithKalshiData = await Promise.all(
          markets.map(async (market) => {
            try {
              const kalshiMarket = await kalshiAPI.getMarketByTicker(market.kalshi_id);
              return {
                id: market.id,
                contractMarketId: market.contract_market_id,
                title: market.title,
                category: market.category,
                kalshiId: market.kalshi_id,
                points: market.points,
                createdAt: market.created_at,
                kalshiStatus: kalshiMarket?.status,
                kalshiOutcome: kalshiMarket?.status === 'settled' ? kalshiMarket.last_price > 0.5 : undefined,
              };
            } catch (error) {
              return {
                id: market.id,
                contractMarketId: market.contract_market_id,
                title: market.title,
                category: market.category,
                kalshiId: market.kalshi_id,
                points: market.points,
                createdAt: market.created_at,
              };
            }
          })
        );

        setPendingMarkets(marketsWithKalshiData);
      }
    } catch (error) {
      console.error('Error loading pending markets:', error);
    }
  };

  const resolveMarket = async (market: PendingMarket, outcome: boolean) => {
    if (!contract) return;

    setResolving(market.id);
    try {
      const tx = await contract.resolveMarket(market.contractMarketId, outcome);
      await tx.wait();

      // Update database
      await supabase
        .from('markets')
        .update({ 
          is_resolved: true, 
          outcome,
          resolution_time: new Date().toISOString()
        })
        .eq('id', market.id);

      toast({
        title: "Market Resolved",
        description: `${market.title} resolved as ${outcome ? 'YES' : 'NO'}`,
      });

      await loadPendingMarkets();
    } catch (error) {
      console.error('Error resolving market:', error);
      toast({
        title: "Error",
        description: "Failed to resolve market",
        variant: "destructive",
      });
    } finally {
      setResolving(null);
    }
  };

  const autoResolveFromKalshi = async () => {
    setLoading(true);
    let resolved = 0;

    try {
      const settledMarkets = pendingMarkets.filter(
        market => market.kalshiStatus === 'settled' && market.kalshiOutcome !== undefined
      );

      for (const market of settledMarkets) {
        try {
          await resolveMarket(market, market.kalshiOutcome!);
          resolved++;
        } catch (error) {
          console.error(`Error auto-resolving market ${market.id}:`, error);
        }
      }

      toast({
        title: "Auto-Resolution Complete",
        description: `${resolved} markets resolved from Kalshi data`,
      });
    } catch (error) {
      console.error('Error in auto-resolution:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (market: PendingMarket) => {
    if (market.kalshiStatus === 'settled') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
          Ready to Resolve
        </Badge>
      );
    } else if (market.kalshiStatus === 'closed') {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
          Closed - Awaiting Settlement
        </Badge>
      );
    } else if (market.kalshiStatus === 'open') {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
          Still Trading
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
          Unknown Status
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Market Resolution</h2>
          <p className="text-gray-400">Resolve markets based on outcomes or Kalshi data</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={loadPendingMarkets}
            variant="outline"
            className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
          >
            Refresh Markets
          </Button>
          <Button
            onClick={autoResolveFromKalshi}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            Auto-Resolve from Kalshi
          </Button>
        </div>
      </div>

      {/* Markets List */}
      <div className="grid gap-4">
        {pendingMarkets.map((market) => (
          <Card key={market.id} className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{market.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Category: {market.category}</span>
                  <span>Points: {market.points}</span>
                  <span>Kalshi ID: {market.kalshiId}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(market)}
                <a
                  href={`https://kalshi.com/events/${market.kalshiId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  View on Kalshi <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {market.kalshiStatus === 'settled' && market.kalshiOutcome !== undefined ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">
                    Kalshi outcome: <strong>{market.kalshiOutcome ? 'YES' : 'NO'}</strong>
                  </p>
                </div>
                <Button
                  onClick={() => resolveMarket(market, market.kalshiOutcome!)}
                  disabled={resolving === market.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {resolving === market.id ? 'Resolving...' : 'Auto-Resolve'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">Manual Resolution:</span>
                <Button
                  onClick={() => resolveMarket(market, true)}
                  disabled={resolving === market.id}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve YES
                </Button>
                <Button
                  onClick={() => resolveMarket(market, false)}
                  disabled={resolving === market.id}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Resolve NO
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {pendingMarkets.length === 0 && (
        <Card className="p-12 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
          <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Pending Markets</h3>
          <p className="text-gray-400">All markets have been resolved</p>
        </Card>
      )}
    </div>
  );
}
