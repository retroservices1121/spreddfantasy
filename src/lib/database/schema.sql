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

-- Additional tables for admin functionality
-- Add this to your existing schema.sql

-- Admin activities log
CREATE TABLE admin_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform settings
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin roles and permissions
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '{}',
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- League templates for quick creation
CREATE TABLE league_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  league_type TEXT NOT NULL,
  default_entry_fee DECIMAL(18, 8),
  default_max_participants INTEGER,
  default_duration_hours INTEGER,
  market_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market resolution log
CREATE TABLE market_resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  resolved_by UUID REFERENCES users(id),
  resolution_method TEXT CHECK (resolution_method IN ('manual', 'kalshi_auto', 'api_sync')),
  outcome BOOLEAN NOT NULL,
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  kalshi_data JSONB,
  transaction_hash TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout history
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(18, 8) NOT NULL,
  position INTEGER NOT NULL, -- 1st, 2nd, 3rd place
  points_earned INTEGER NOT NULL,
  transaction_hash TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance analytics
CREATE TABLE league_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  total_entries INTEGER DEFAULT 0,
  total_revenue DECIMAL(18, 8) DEFAULT 0,
  platform_fees DECIMAL(18, 8) DEFAULT 0,
  total_payouts DECIMAL(18, 8) DEFAULT 0,
  avg_accuracy DECIMAL(5, 2), -- Average prediction accuracy
  most_accurate_user UUID REFERENCES users(id),
  analytics_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, analytics_date)
);

-- Indexes for performance
CREATE INDEX idx_admin_activities_admin_id ON admin_activities(admin_id);
CREATE INDEX idx_admin_activities_created_at ON admin_activities(created_at DESC);
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX idx_market_resolutions_market_id ON market_resolutions(market_id);
CREATE INDEX idx_market_resolutions_resolved_at ON market_resolutions(resolved_at DESC);
CREATE INDEX idx_payouts_league_id ON payouts(league_id);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_league_analytics_league_id ON league_analytics(league_id);
CREATE INDEX idx_league_analytics_date ON league_analytics(analytics_date DESC);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description) VALUES
('platform_fee_percentage', '5', 'number', 'Platform fee percentage (0-10)'),
('daily_entry_fee', '5.00', 'number', 'Default entry fee for daily leagues in USDC'),
('weekly_entry_fee', '10.00', 'number', 'Default entry fee for weekly leagues in USDC'),
('monthly_entry_fee', '25.00', 'number', 'Default entry fee for monthly leagues in USDC'),
('max_markets_per_portfolio', '10', 'number', 'Maximum markets a user can select per portfolio'),
('auto_resolve_enabled', 'true', 'boolean', 'Enable automatic market resolution from Kalshi'),
('kalshi_sync_interval', '300', 'number', 'Kalshi sync interval in seconds'),
('maintenance_mode', 'false', 'boolean', 'Platform maintenance mode'),
('min_league_participants', '2', 'number', 'Minimum participants required to start a league');

-- Insert default league templates
INSERT INTO league_templates (name, description, league_type, default_entry_fee, default_max_participants, default_duration_hours, market_categories, created_by) VALUES
('Daily Quick Play', 'Fast-paced daily prediction league', 'daily', 5.00, 50, 24, ARRAY['sports', 'crypto'], (SELECT id FROM users WHERE privy_id = 'system' LIMIT 1)),
('Weekly Challenge', 'Week-long prediction competition', 'weekly', 10.00, 100, 168, ARRAY['sports', 'crypto', 'politics'], (SELECT id FROM users WHERE privy_id = 'system' LIMIT 1)),
('Monthly Championship', 'Monthly prediction championship', 'monthly', 25.00, 200, 720, ARRAY['sports', 'crypto', 'politics', 'entertainment'], (SELECT id FROM users WHERE privy_id = 'system' LIMIT 1));

-- RLS Policies for admin tables
ALTER TABLE admin_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Admin activities - only admins can view
CREATE POLICY "Admins can view admin activities" ON admin_activities
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT u.privy_id FROM users u 
      JOIN admin_roles ar ON u.id = ar.user_id 
      WHERE ar.role IN ('super_admin', 'admin')
    )
  );

-- Platform settings - only super admins can modify, admins can view
CREATE POLICY "Super admins can manage platform settings" ON platform_settings
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT u.privy_id FROM users u 
      JOIN admin_roles ar ON u.id = ar.user_id 
      WHERE ar.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view platform settings" ON platform_settings
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT u.privy_id FROM users u 
      JOIN admin_roles ar ON u.id = ar.user_id 
      WHERE ar.role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Admin roles - only super admins can manage
CREATE POLICY "Super admins can manage admin roles" ON admin_roles
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT u.privy_id FROM users u 
      JOIN admin_roles ar ON u.id = ar.user_id 
      WHERE ar.role = 'super_admin'
    )
  );

-- Market resolutions - admins can view all
CREATE POLICY "Admins can view market resolutions" ON market_resolutions
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT u.privy_id FROM users u 
      JOIN admin_roles ar ON u.id = ar.user_id 
      WHERE ar.role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Payouts - users can view their own, admins can view all
CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text)
  );

CREATE POLICY "Admins can view all payouts" ON payouts
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT u.privy_id FROM users u 
      JOIN admin_roles ar ON u.id = ar.user_id 
      WHERE ar.role IN ('super_admin', 'admin')
    )
  );

-- Functions for analytics
CREATE OR REPLACE FUNCTION calculate_league_analytics(league_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO league_analytics (
    league_id,
    total_entries,
    total_revenue,
    platform_fees,
    total_payouts,
    avg_accuracy
  )
  SELECT 
    league_uuid,
    COUNT(p.id) as total_entries,
    l.total_prize_pool,
    l.total_prize_pool * 0.05 as platform_fees, -- Assuming 5% platform fee
    COALESCE(SUM(pay.amount), 0) as total_payouts,
    AVG(
      CASE 
        WHEN pred.prediction = m.outcome THEN 1.0 
        ELSE 0.0 
      END
    ) as avg_accuracy
  FROM leagues l
  LEFT JOIN portfolios p ON l.id = p.league_id
  LEFT JOIN predictions pred ON p.user_id = pred.user_id AND p.league_id = pred.league_id
  LEFT JOIN markets m ON pred.market_id = m.id AND m.is_resolved = true
  LEFT JOIN payouts pay ON l.id = pay.league_id
  WHERE l.id = league_uuid
  GROUP BY l.id, l.total_prize_pool
  ON CONFLICT (league_id, analytics_date) 
  DO UPDATE SET
    total_entries = EXCLUDED.total_entries,
    total_revenue = EXCLUDED.total_revenue,
    platform_fees = EXCLUDED.platform_fees,
    total_payouts = EXCLUDED.total_payouts,
    avg_accuracy = EXCLUDED.avg_accuracy;
END;
$ LANGUAGE plpgsql;

-- Trigger to update analytics when league is resolved
CREATE OR REPLACE FUNCTION trigger_calculate_analytics()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.is_resolved = true AND OLD.is_resolved = false THEN
    PERFORM calculate_league_analytics(NEW.id);
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER league_resolved_analytics
  AFTER UPDATE ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_analytics();
