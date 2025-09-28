-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Privy)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  privy_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  league_type TEXT NOT NULL CHECK (league_type IN ('daily', 'weekly', 'monthly')),
  entry_fee DECIMAL(18, 8) NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  creator_id UUID REFERENCES users(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_resolved BOOLEAN DEFAULT false,
  contract_league_id INTEGER,
  total_prize_pool DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Markets table
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  outcome BOOLEAN,
  kalshi_id TEXT UNIQUE,
  contract_market_id INTEGER,
  resolution_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League markets (many-to-many)
CREATE TABLE league_markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, market_id)
);

-- User portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  has_joined BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, league_id)
);

-- Portfolio markets (selected markets for each portfolio)
CREATE TABLE portfolio_markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, market_id)
);

-- User predictions
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  prediction BOOLEAN NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  is_correct BOOLEAN,
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, league_id, market_id)
);

-- Kalshi sync log
CREATE TABLE kalshi_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  message TEXT,
  markets_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leagues_creator ON leagues(creator_id);
CREATE INDEX idx_leagues_active ON leagues(is_active);
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_markets_kalshi_id ON markets(kalshi_id);
CREATE INDEX idx_portfolios_user_league ON portfolios(user_id, league_id);
CREATE INDEX idx_predictions_user_league ON predictions(user_id, league_id);
CREATE INDEX idx_predictions_market ON predictions(market_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = privy_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = privy_id);

-- Anyone can view leagues and markets
CREATE POLICY "Anyone can view leagues" ON leagues
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view markets" ON markets
  FOR SELECT USING (true);

-- Users can only see their own portfolios and predictions
CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));

CREATE POLICY "Users can view own predictions" ON predictions
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));
