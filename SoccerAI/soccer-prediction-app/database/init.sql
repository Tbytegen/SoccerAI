-- Soccer Prediction Application Database Schema
-- This script initializes the database with tables for teams, matches, predictions, and more

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    league VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    position INTEGER,
    points INTEGER DEFAULT 0,
    played_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
    form VARCHAR(10), -- e.g., "WWDLL"
    logo_url TEXT,
    website_url TEXT,
    founded INTEGER,
    stadium VARCHAR(255),
    stadium_capacity INTEGER,
    market_value DECIMAL(15,2),
    squad_size INTEGER,
    average_age DECIMAL(3,1),
    foreigners INTEGER,
    national_team_players INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    league VARCHAR(100) NOT NULL,
    match_date TIMESTAMP NOT NULL,
    venue VARCHAR(255),
    referee VARCHAR(255),
    attendance INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled',
    -- Match results (for completed matches)
    home_score INTEGER,
    away_score INTEGER,
    -- Match events
    home_goals JSONB,
    away_goals JSONB,
    -- Pre-match information
    weather_conditions JSONB,
    temperature INTEGER,
    wind_speed INTEGER,
    precipitation DECIMAL(4,2),
    -- Match statistics
    home_possession DECIMAL(5,2),
    away_possession DECIMAL(5,2),
    home_shots INTEGER,
    away_shots INTEGER,
    home_shots_on_target INTEGER,
    away_shots_on_target INTEGER,
    home_corners INTEGER,
    away_corners INTEGER,
    home_fouls INTEGER,
    away_fouls INTEGER,
    home_yellow_cards INTEGER,
    away_yellow_cards INTEGER,
    home_red_cards INTEGER,
    away_red_cards INTEGER,
    -- Meta information
    match_round VARCHAR(100),
    match_day INTEGER,
    season VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    predicted_outcome VARCHAR(20) NOT NULL, -- 'home_win', 'draw', 'away_win'
    predicted_probabilities JSONB, -- {"home_win": 0.45, "draw": 0.25, "away_win": 0.30}
    confidence_score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    model_version VARCHAR(50) NOT NULL,
    model_name VARCHAR(100), -- 'xgboost', 'random_forest', 'ensemble'
    features_used JSONB,
    prediction_reasons TEXT[],
    is_high_confidence BOOLEAN DEFAULT FALSE,
    -- External factors
    weather_impact DECIMAL(3,2),
    travel_impact DECIMAL(3,2),
    rest_days_impact DECIMAL(3,2),
    injury_impact DECIMAL(3,2),
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    actual_outcome VARCHAR(20), -- filled after match completion
    was_correct BOOLEAN, -- filled after match completion
    confidence_vs_actual DECIMAL(5,4) -- confidence difference from actual
);

-- Users table (for future user management)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'analyst'
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team form history (for tracking form over time)
CREATE TABLE IF NOT EXISTS team_form_history (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    form_rating DECIMAL(3,2), -- 0.00 to 1.00
    points_in_period INTEGER DEFAULT 0,
    games_in_period INTEGER DEFAULT 0,
    wins_in_period INTEGER DEFAULT 0,
    draws_in_period INTEGER DEFAULT 0,
    losses_in_period INTEGER DEFAULT 0,
    goals_for_in_period INTEGER DEFAULT 0,
    goals_against_in_period INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, match_date)
);

-- Head-to-head records
CREATE TABLE IF NOT EXISTS head_to_head_records (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    total_matches INTEGER DEFAULT 0,
    home_wins INTEGER DEFAULT 0,
    away_wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    home_goals_total INTEGER DEFAULT 0,
    away_goals_total INTEGER DEFAULT 0,
    last_meeting_date TIMESTAMP,
    last_meeting_result VARCHAR(20),
    last_meeting_score VARCHAR(10),
    recent_form_home JSONB, -- last 5 results from home perspective
    recent_form_away JSONB, -- last 5 results from away perspective
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(home_team_id, away_team_id)
);

-- League tables (current standings)
CREATE TABLE IF NOT EXISTS league_tables (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    league VARCHAR(100) NOT NULL,
    season VARCHAR(20) NOT NULL,
    position INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    played_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER,
    form VARCHAR(10),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, league, season)
);

-- Data sources tracking
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit INTEGER DEFAULT 1, -- requests per second
    last_successful_scrape TIMESTAMP,
    last_failed_scrape TIMESTAMP,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scraping jobs tracking
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) REFERENCES data_sources(name),
    job_type VARCHAR(100) NOT NULL, -- 'team_data', 'match_data', 'league_table'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prediction tracking and analytics
CREATE TABLE IF NOT EXISTS prediction_analytics (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    league VARCHAR(100) NOT NULL,
    confidence_level VARCHAR(20), -- 'low', 'medium', 'high'
    model_agreement DECIMAL(3,2), -- 0.00 to 1.00
    data_quality_score DECIMAL(3,2), -- 0.00 to 1.00
    external_factors_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prediction_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league);
CREATE INDEX IF NOT EXISTS idx_teams_position ON teams(league, position);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON predictions(confidence_score);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_name);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_head_to_head_teams ON head_to_head_records(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_team_form_team_date ON team_form_history(team_id, match_date);
CREATE INDEX IF NOT EXISTS idx_league_tables_league_season ON league_tables(league, season);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_head_to_head_updated_at BEFORE UPDATE ON head_to_head_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data sources
INSERT INTO data_sources (name, base_url, rate_limit) VALUES
('Premier League Official', 'https://www.premierleague.com', 2),
('La Liga Official', 'https://www.laliga.com', 2),
('Serie A Official', 'https://www.legaseriea.it', 2),
('Bundesliga Official', 'https://www.bundesliga.com', 2),
('Ligue 1 Official', 'https://www.ligue1.com', 2),
('ESPN Soccer', 'https://www.espn.com/soccer', 1),
('BBC Sport Football', 'https://www.bbc.com/sport/football', 1),
('Sky Sports Football', 'https://www.skysports.com/football', 1),
('Transfermarkt', 'https://www.transfermarkt.com', 1)
ON CONFLICT (name) DO NOTHING;

-- Create sample teams (this will be replaced by actual scraping)
INSERT INTO teams (name, full_name, league, country, position, points) VALUES
('Manchester United', 'Manchester United Football Club', 'Premier League', 'England', 1, 0),
('Liverpool', 'Liverpool Football Club', 'Premier League', 'England', 2, 0),
('Arsenal', 'Arsenal Football Club', 'Premier League', 'England', 3, 0),
('Real Madrid', 'Real Madrid Club de Fútbol', 'La Liga', 'Spain', 1, 0),
('Barcelona', 'Futbol Club Barcelona', 'La Liga', 'Spain', 2, 0),
('Atlético Madrid', 'Club Atlético de Madrid', 'La Liga', 'Spain', 3, 0)
ON CONFLICT DO NOTHING;