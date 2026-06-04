-- =============================================
-- QUINIELA VIRTUAL - INTERPARTS MONTERREY
-- Supabase Schema
-- =============================================

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(12) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table (72 group stage matches)
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_number INT UNIQUE NOT NULL,
  home_team VARCHAR(50) NOT NULL,
  away_team VARCHAR(50) NOT NULL,
  home_flag VARCHAR(10) DEFAULT '',
  away_flag VARCHAR(10) DEFAULT '',
  match_date TIMESTAMPTZ,
  group_name VARCHAR(5),
  home_score INT,
  away_score INT,
  result VARCHAR(5), -- 'home', 'away', 'draw' — set after match
  is_locked BOOLEAN DEFAULT FALSE, -- lock picks before kickoff
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Picks table
CREATE TABLE picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  pick VARCHAR(5) NOT NULL CHECK (pick IN ('home', 'away', 'draw')),
  is_correct BOOLEAN, -- computed after result is entered
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, match_id)
);

-- Admin sessions (simple password-based)
CREATE TABLE admin_config (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default admin password (change this!)
INSERT INTO admin_config VALUES ('admin_password', 'Interparts2025');

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Public can read matches
CREATE POLICY "matches_public_read" ON matches FOR SELECT USING (true);

-- Public can read clients (needed for ranking)
CREATE POLICY "clients_public_read" ON clients FOR SELECT USING (true);

-- Public can insert/read picks
CREATE POLICY "picks_public_read" ON picks FOR SELECT USING (true);
CREATE POLICY "picks_public_insert" ON picks FOR INSERT WITH CHECK (true);

-- Admin config only via service role (no public access)
CREATE POLICY "admin_config_no_public" ON admin_config FOR SELECT USING (false);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Recompute is_correct for all picks of a match when result is entered
CREATE OR REPLACE FUNCTION update_picks_correctness(p_match_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE picks p
  SET is_correct = (p.pick = m.result)
  FROM matches m
  WHERE p.match_id = p_match_id
    AND m.id = p_match_id
    AND m.result IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE(
  client_id UUID,
  client_name VARCHAR,
  client_code VARCHAR,
  total_points BIGINT,
  total_picks BIGINT,
  correct_picks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.code,
    COUNT(CASE WHEN p.is_correct = true THEN 1 END) AS total_points,
    COUNT(p.id) AS total_picks,
    COUNT(CASE WHEN p.is_correct = true THEN 1 END) AS correct_picks
  FROM clients c
  LEFT JOIN picks p ON p.client_id = c.id
  GROUP BY c.id, c.name, c.code
  ORDER BY total_points DESC, total_picks DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
