import axios from 'axios';

export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  status: 'open' | 'closed' | 'settled';
  yes_ask?: number;
  yes_bid?: number;
  no_ask?: number;
  no_bid?: number;
  last_price?: number;
  close_time?: string;
  settle_time?: string;
  category?: string;
}

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  markets: KalshiMarket[];
}

class KalshiAPI {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.KALSHI_API_URL || 'https://trading-api.kalshi.com/trade-api/v2';
    this.apiKey = process.env.KALSHI_API_KEY || '';
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Kalshi API Error:', error);
      throw new Error(`Kalshi API request failed: ${error}`);
    }
  }

  async getEvents(limit = 100): Promise<KalshiEvent[]> {
    const data = await this.makeRequest('/events', { limit });
    return data.events || [];
  }

  async getMarkets(limit = 100, status = 'open'): Promise<KalshiMarket[]> {
    const data = await this.makeRequest('/markets', { limit, status });
    return data.markets || [];
  }

  async getMarketByTicker(ticker: string): Promise<KalshiMarket | null> {
    try {
      const data = await this.makeRequest(`/markets/${ticker}`);
      return data.market || null;
    } catch (error) {
      return null;
    }
  }

  async getMarketsByCategory(category: string, limit = 50): Promise<KalshiMarket[]> {
    const events = await this.getEvents();
    const filteredEvents = events.filter(event => 
      event.category?.toLowerCase().includes(category.toLowerCase())
    );
    
    const markets: KalshiMarket[] = [];
    for (const event of filteredEvents) {
      markets.push(...event.markets);
      if (markets.length >= limit) break;
    }
    
    return markets.slice(0, limit);
  }

  categorizeMarket(market: KalshiMarket): string {
    const title = market.title.toLowerCase();
    
    if (title.includes('bitcoin') || title.includes('btc') || title.includes('ethereum') || title.includes('crypto')) {
      return 'crypto';
    }
    if (title.includes('election') || title.includes('president') || title.includes('congress') || title.includes('politics')) {
      return 'politics';
    }
    if (title.includes('nfl') || title.includes('nba') || title.includes('mlb') || title.includes('sports') || title.includes('football')) {
      return 'sports';
    }
    if (title.includes('movie') || title.includes('oscar') || title.includes('entertainment') || title.includes('celebrity')) {
      return 'entertainment';
    }
    if (title.includes('weather') || title.includes('temperature') || title.includes('rain') || title.includes('snow')) {
      return 'weather';
    }
    if (title.includes('stock') || title.includes('market') || title.includes('economy') || title.includes('gdp')) {
      return 'economy';
    }
    
    return 'other';
  }

  calculatePoints(category: string): number {
    const pointMap: Record<string, number> = {
      'crypto': 100,
      'politics': 80,
      'sports': 60,
      'entertainment': 40,
      'weather': 30,
      'economy': 70,
      'other': 50,
    };
    
    return pointMap[category] || 50;
  }
}

export const kalshiAPI = new KalshiAPI();
