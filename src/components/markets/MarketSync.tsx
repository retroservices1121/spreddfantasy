'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { kalshiAPI } from '@/lib/integrations/kalshi';
import { supabase } from '@/lib/database/supabase';
import { toast } from '@/components/ui/use-toast';

export function MarketSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState({ imported: 0, updated: 0, errors: 0 });

  const syncMarkets = async () => {
    setSyncing(true);
    let imported = 0;
    let updated = 0;
    let errors = 0;

    try {
      // Fetch markets from Kalshi
      const kalshiMarkets = await kalshiAPI.getMarkets(100);
      
      for (const kalshiMarket of kalshiMarkets) {
        try {
          const category = kalshiAPI.categorizeMarket(kalshiMarket);
          const points = kalshiAPI.calculatePoints(category);

          // Check if market already exists
          const { data: existingMarket } = await supabase
            .from('markets')
            .select('id')
            .eq('kalshi_id', kalshiMarket.ticker)
            .single();

          if (existingMarket) {
            // Update existing market
            const { error: updateError } = await supabase
              .from('markets')
              .update({
                title: kalshiMarket.title,
                category,
                points,
                is_resolved: kalshiMarket.status === 'settled',
                updated_at: new Date().toISOString(),
              })
              .eq('kalshi_id', kalshiMarket.ticker);

            if (updateError) {
              console.error('Update error:', updateError);
              errors++;
            } else {
              updated++;
            }
          } else {
            // Create new market
            const { error: insertError } = await supabase
              .from('markets')
              .insert({
                title: kalshiMarket.title,
                description: kalshiMarket.subtitle,
                category,
                points,
                kalshi_id: kalshiMarket.ticker,
                is_resolved: kalshiMarket.status === 'settled',
              });

            if (insertError) {
              console.error('Insert error:', insertError);
              errors++;
            } else {
              imported++;
            }
          }
        } catch (error) {
          console.error('Market processing error:', error);
          errors++;
        }
      }

      // Log sync result
      await supabase.from('kalshi_sync_log').insert({
        sync_type: 'markets',
        status: errors === 0 ? 'success' : 'error',
        message: `Imported: ${imported}, Updated: ${updated}, Errors: ${errors}`,
        markets_synced: imported + updated,
      });

      setSyncStats({ imported, updated, errors });
      setLastSync(new Date());

      toast({
        title: "Markets Synced",
        description: `${imported} imported, ${updated} updated, ${errors} errors`,
        variant: errors > 0 ? "destructive" : "default",
      });

    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync markets from Kalshi",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Kalshi Market Sync</h3>
          <p className="text-gray-400 text-sm">
            Sync prediction markets from Kalshi API
          </p>
        </div>
        <Button
          onClick={syncMarkets}
          disabled={syncing}
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Markets
            </>
          )}
        </Button>
      </div>

      {lastSync && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Imported</span>
            </div>
            <div className="text-2xl font-bold text-white">{syncStats.imported}</div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Updated</span>
            </div>
            <div className="text-2xl font-bold text-white">{syncStats.updated}</div>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Errors</span>
            </div>
            <div className="text-2xl font-bold text-white">{syncStats.errors}</div>
          </div>
        </div>
      )}

      {lastSync && (
        <div className="text-sm text-gray-400">
          Last sync: {lastSync.toLocaleString()}
        </div>
      )}
    </Card>
  );
}
