-- SoccerAI Production Database Indexes

-- Users table indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_users_subscription ON users(subscription_type);

-- Teams table indexes
CREATE INDEX CONCURRENTLY idx_teams_league_id ON teams(league_id);
CREATE INDEX CONCURRENTLY idx_teams_api_id ON teams(api_team_id);

-- Matches table indexes (most critical for performance)
CREATE INDEX CONCURRENTLY idx_matches_date ON matches(match_date);
CREATE INDEX CONCURRENTLY idx_matches_league ON matches(league_id);
CREATE INDEX CONCURRENTLY idx_matches_status ON matches(status);
CREATE INDEX CONCURRENTLY idx_matches_home_team ON matches(home_team_id);
CREATE INDEX CONCURRENTLY idx_matches_away_team ON matches(away_team_id);
CREATE INDEX CONCURRENTLY idx_matches_date_status ON matches(match_date, status);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_matches_league_date ON matches(league_id, match_date);
CREATE INDEX CONCURRENTLY idx_matches_upcoming ON matches(status, match_date) WHERE status IN ('scheduled', 'pending');

-- Predictions table indexes
CREATE INDEX CONCURRENTLY idx_predictions_user ON predictions(user_id);
CREATE INDEX CONCURRENTLY idx_predictions_match ON predictions(match_id);
CREATE INDEX CONCURRENTLY idx_predictions_date ON predictions(prediction_date);
CREATE INDEX CONCURRENTLY idx_predictions_confidence ON predictions(confidence_score);
CREATE INDEX CONCURRENTLY idx_predictions_correct ON predictions(is_correct) WHERE is_correct IS NOT NULL;

-- Composite indexes for analytics queries
CREATE INDEX CONCURRENTLY idx_predictions_user_date ON predictions(user_id, prediction_date);
CREATE INDEX CONCURRENTLY idx_predictions_match_user ON predictions(match_id, user_id);

-- Leagues table indexes
CREATE INDEX CONCURRENTLY idx_leagues_country ON leagues(country);
CREATE INDEX CONCURRENTLY idx_leagues_season ON leagues(season);

-- Update statistics
ANALYZE;