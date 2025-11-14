/**
 * Feature Engineering Service
 * Creates comprehensive features for ML prediction models
 */

import { db } from '../config/database';
import { logger } from '../utils/logger';

export interface MatchFeatures {
  // Team-based features (both home and away)
  home_team_features: TeamFeatures;
  away_team_features: TeamFeatures;
  
  // Match-specific features
  match_features: MatchSpecificFeatures;
  
  // Historical features
  head_to_head_features: HeadToHeadFeatures;
  
  // External factors
  external_features: ExternalFactors;
}

export interface TeamFeatures {
  // Current season statistics
  league_position: number;
  points_per_game: number;
  wins_percentage: number;
  draws_percentage: number;
  losses_percentage: number;
  goals_per_game: number;
  goals_conceded_per_game: number;
  goal_difference_per_game: number;
  
  // Form features (last 5/10 games)
  form_wins_last_5: number;
  form_draws_last_5: number;
  form_losses_last_5: number;
  form_points_last_5: number;
  form_goals_for_last_5: number;
  form_goals_against_last_5: number;
  
  form_wins_last_10: number;
  form_draws_last_10: number;
  form_losses_last_10: number;
  form_points_last_10: number;
  
  // Home/Away specific
  home_wins_percentage?: number;
  home_goals_per_game?: number;
  home_conceded_per_game?: number;
  away_wins_percentage?: number;
  away_goals_per_game?: number;
  away_conceded_per_game?: number;
  
  // Streak features
  current_streak_type: 'win' | 'draw' | 'loss' | 'none';
  current_streak_length: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  
  // Recent performance trends
  performance_trend_5: number; // Goals difference trend
  performance_trend_10: number;
  
  // League strength
  league_strength_rating: number;
  relative_strength_vs_league_average: number;
}

export interface MatchSpecificFeatures {
  // Match context
  days_since_last_match: number;
  matches_in_last_14_days: number;
  is_weekend_match: boolean;
  is_even_week: boolean;
  match_importance: number; // 1-5 scale
  
  // League factors
  league_avg_goals_per_game: number;
  league_avg_home_advantage: number;
  
  // Season progression
  season_week: number;
  season_matches_played: number;
  season_progress_percentage: number;
}

export interface HeadToHeadFeatures {
  // H2H statistics
  h2h_matches_played: number;
  h2h_home_wins: number;
  h2h_draws: number;
  h2h_away_wins: number;
  h2h_home_goals_avg: number;
  h2h_away_goals_avg: number;
  h2h_total_goals_avg: number;
  
  // Recent H2H (last 5)
  recent_h2h_home_wins: number;
  recent_h2h_draws: number;
  recent_h2h_away_wins: number;
  
  // H2H form trends
  h2h_trend: number; // Positive = home team improving
  
  // Venue-specific H2H
  venue_h2h_home_wins: number;
  venue_h2h_matches: number;
}

export interface ExternalFactors {
  // Weather (future enhancement)
  weather_condition: number; // 1-10 scale
  temperature: number;
  
  // Crowd factors
  expected_attendance: number;
  attendance_percentage: number;
  
  // Referee impact
  referee_home_favor_bias: number;
  referee_avg_cards_per_game: number;
  referee_avg_penalties_per_game: number;
  
  // Motivation factors
  home_team_motivation: number; // Based on stakes
  away_team_motivation: number;
  
  // Injuries/suspensions impact
  home_team_key_players_missing: number; // Percentage
  away_team_key_players_missing: number;
}

export class FeatureEngineeringService {
  
  /**
   * Generate comprehensive features for a match prediction
   */
  async generateMatchFeatures(homeTeamId: number, awayTeamId: number): Promise<MatchFeatures> {
    try {
      logger.info(`Generating features for match: Team ${homeTeamId} vs ${awayTeamId}`);
      
      const [
        homeTeamFeatures,
        awayTeamFeatures,
        matchFeatures,
        headToHeadFeatures,
        externalFeatures
      ] = await Promise.all([
        this.generateTeamFeatures(homeTeamId, 'home'),
        this.generateTeamFeatures(awayTeamId, 'away'),
        this.generateMatchSpecificFeatures(homeTeamId, awayTeamId),
        this.generateHeadToHeadFeatures(homeTeamId, awayTeamId),
        this.generateExternalFactors(homeTeamId, awayTeamId)
      ]);

      const features: MatchFeatures = {
        home_team_features: homeTeamFeatures,
        away_team_features: awayTeamFeatures,
        match_features: matchFeatures,
        head_to_head_features: headToHeadFeatures,
        external_features: externalFeatures
      };

      logger.info(`Generated ${this.countFeatures(features)} features for match prediction`);
      return features;
      
    } catch (error) {
      logger.error('Error generating match features:', error);
      throw error;
    }
  }

  /**
   * Generate team-specific features
   */
  private async generateTeamFeatures(teamId: number, side: 'home' | 'away'): Promise<TeamFeatures> {
    try {
      // Get current team statistics
      const teamStatsResult = await db.query(
        `SELECT 
          league_position, points, matches_played, wins, draws, losses,
          goals_for, goals_against, form, last_updated
         FROM teams WHERE id = $1`,
        [teamId]
      );

      if (teamStatsResult.rows.length === 0) {
        throw new Error(`Team ${teamId} not found`);
      }

      const stats = teamStatsResult.rows[0];
      const isHome = side === 'home';

      // Calculate basic statistics
      const matchesPlayed = stats.matches_played || 0;
      const pointsPerGame = matchesPlayed > 0 ? stats.points / matchesPlayed : 0;
      const winsPercentage = matchesPlayed > 0 ? (stats.wins / matchesPlayed) * 100 : 0;
      const drawsPercentage = matchesPlayed > 0 ? (stats.draws / matchesPlayed) * 100 : 0;
      const lossesPercentage = matchesPlayed > 0 ? (stats.losses / matchesPlayed) * 100 : 0;
      const goalsPerGame = matchesPlayed > 0 ? stats.goals_for / matchesPlayed : 0;
      const goalsConcededPerGame = matchesPlayed > 0 ? stats.goals_against / matchesPlayed : 0;
      const goalDifferencePerGame = goalsPerGame - goalsConcededPerGame;

      // Get recent form (last 5 and 10 games)
      const recentForm = await this.getRecentForm(teamId, 10);
      const formLast5 = recentForm.slice(0, 5);
      const formLast10 = recentForm;

      // Calculate form statistics
      const formStatsLast5 = this.calculateFormStats(formLast5);
      const formStatsLast10 = this.calculateFormStats(formLast10);

      // Get home/away specific stats if needed
      let homeWinsPercentage, homeGoalsPerGame, homeConcededPerGame;
      let awayWinsPercentage, awayGoalsPerGame, awayConcededPerGame;

      if (isHome) {
        const homeStats = await this.getHomeAwayStats(teamId, 'home');
        homeWinsPercentage = homeStats.winsPercentage;
        homeGoalsPerGame = homeStats.goalsPerGame;
        homeConcededPerGame = homeStats.concededPerGame;
      } else {
        const awayStats = await this.getHomeAwayStats(teamId, 'away');
        awayWinsPercentage = awayStats.winsPercentage;
        awayGoalsPerGame = awayStats.goalsPerGame;
        awayConcededPerGame = awayStats.concededPerGame;
      }

      // Calculate streaks
      const streakInfo = this.calculateStreaks(recentForm);
      
      // Calculate performance trends
      const performanceTrend5 = this.calculatePerformanceTrend(formLast5);
      const performanceTrend10 = this.calculatePerformanceTrend(formLast10);

      // Calculate league strength
      const leagueStrength = await this.calculateLeagueStrength(teamId);

      return {
        // Current season statistics
        league_position: stats.league_position || 0,
        points_per_game: pointsPerGame,
        wins_percentage: winsPercentage,
        draws_percentage: drawsPercentage,
        losses_percentage: lossesPercentage,
        goals_per_game: goalsPerGame,
        goals_conceded_per_game: goalsConcededPerGame,
        goal_difference_per_game: goalDifferencePerGame,

        // Form features (last 5)
        form_wins_last_5: formStatsLast5.wins,
        form_draws_last_5: formStatsLast5.draws,
        form_losses_last_5: formStatsLast5.losses,
        form_points_last_5: formStatsLast5.points,
        form_goals_for_last_5: formStatsLast5.goalsFor,
        form_goals_against_last_5: formStatsLast5.goalsAgainst,

        // Form features (last 10)
        form_wins_last_10: formStatsLast10.wins,
        form_draws_last_10: formStatsLast10.draws,
        form_losses_last_10: formStatsLast10.losses,
        form_points_last_10: formStatsLast10.points,

        // Home/Away specific
        home_wins_percentage: homeWinsPercentage,
        home_goals_per_game: homeGoalsPerGame,
        home_conceded_per_game: homeConcededPerGame,
        away_wins_percentage: awayWinsPercentage,
        away_goals_per_game: awayGoalsPerGame,
        away_conceded_per_game: awayConcededPerGame,

        // Streak features
        current_streak_type: streakInfo.type,
        current_streak_length: streakInfo.length,
        longest_win_streak: streakInfo.longestWin,
        longest_loss_streak: streakInfo.longestLoss,

        // Performance trends
        performance_trend_5: performanceTrend5,
        performance_trend_10: performanceTrend10,

        // League strength
        league_strength_rating: leagueStrength.rating,
        relative_strength_vs_league_average: leagueStrength.relativeStrength
      };

    } catch (error) {
      logger.error(`Error generating team features for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Generate match-specific features
   */
  private async generateMatchSpecificFeatures(homeTeamId: number, awayTeamId: number): Promise<MatchSpecificFeatures> {
    try {
      const now = new Date();
      
      // Get recent matches for both teams to calculate rest days
      const recentMatches = await db.query(
        `SELECT match_date FROM matches 
         WHERE (home_team_id = $1 OR away_team_id = $2) 
         AND match_date < $3 
         AND status = 'completed'
         ORDER BY match_date DESC 
         LIMIT 5`,
        [homeTeamId, awayTeamId, now]
      );

      const daysSinceLastMatch = recentMatches.rows.length > 0 
        ? Math.floor((now.getTime() - new Date(recentMatches.rows[0].match_date).getTime()) / (1000 * 60 * 60 * 24))
        : 14; // Default if no recent matches

      // Count matches in last 14 days
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const recentMatchesCount = await db.query(
        `SELECT COUNT(*) as count FROM matches 
         WHERE (home_team_id = $1 OR away_team_id = $2) 
         AND match_date >= $3 
         AND status = 'completed'`,
        [homeTeamId, awayTeamId, fourteenDaysAgo]
      );

      // Check if weekend match
      const isWeekendMatch = now.getDay() === 0 || now.getDay() === 6;
      
      // Calculate season week and progress
      const seasonStart = new Date(now.getFullYear(), 7, 1); // August 1st
      const seasonProgressPercentage = Math.min(100, ((now.getTime() - seasonStart.getTime()) / (365 * 24 * 60 * 60 * 1000)) * 100);
      const seasonWeek = Math.ceil(seasonProgressPercentage / 2.6); // ~38 weeks per season

      // Get league averages
      const leagueAverages = await this.getLeagueAverages();

      return {
        days_since_last_match: daysSinceLastMatch,
        matches_in_last_14_days: parseInt(recentMatchesCount.rows[0].count),
        is_weekend_match: isWeekendMatch,
        is_even_week: seasonWeek % 2 === 0,
        match_importance: this.calculateMatchImportance(homeTeamId, awayTeamId),
        league_avg_goals_per_game: leagueAverages.avgGoalsPerGame,
        league_avg_home_advantage: leagueAverages.avgHomeAdvantage,
        season_week: seasonWeek,
        season_matches_played: Math.floor(seasonWeek * 2), // ~2 games per week
        season_progress_percentage: seasonProgressPercentage
      };

    } catch (error) {
      logger.error('Error generating match-specific features:', error);
      throw error;
    }
  }

  /**
   * Generate head-to-head features
   */
  private async generateHeadToHeadFeatures(homeTeamId: number, awayTeamId: number): Promise<HeadToHeadFeatures> {
    try {
      // Get historical H2H data
      const h2hResults = await db.query(
        `SELECT 
          m.home_score, m.away_score, m.match_date, t_home.name as home_name, t_away.name as away_name
         FROM matches m
         JOIN teams t_home ON m.home_team_id = t_home.id
         JOIN teams t_away ON m.away_team_id = t_away.id
         WHERE ((m.home_team_id = $1 AND m.away_team_id = $2) OR 
                (m.home_team_id = $2 AND m.away_team_id = $1))
         AND m.status = 'completed'
         AND m.home_score IS NOT NULL
         ORDER BY m.match_date DESC
         LIMIT 20`,
        [homeTeamId, awayTeamId]
      );

      const h2hMatches = h2hResults.rows;
      const h2hMatchesPlayed = h2hMatches.length;

      if (h2hMatchesPlayed === 0) {
        // Default values if no H2H history
        return {
          h2h_matches_played: 0,
          h2h_home_wins: 0,
          h2h_draws: 0,
          h2h_away_wins: 0,
          h2h_home_goals_avg: 0,
          h2h_away_goals_avg: 0,
          h2h_total_goals_avg: 0,
          recent_h2h_home_wins: 0,
          recent_h2h_draws: 0,
          recent_h2h_away_wins: 0,
          h2h_trend: 0,
          venue_h2h_home_wins: 0,
          venue_h2h_matches: 0
        };
      }

      // Calculate H2H statistics
      let homeWins = 0, draws = 0, awayWins = 0;
      let totalHomeGoals = 0, totalAwayGoals = 0;

      h2hMatches.forEach(match => {
        const homeScore = match.home_score;
        const awayScore = match.away_score;
        
        totalHomeGoals += homeScore;
        totalAwayGoals += awayScore;

        if (homeScore > awayScore) {
          // Check if this was the current home team winning
          if (match.home_name && match.away_name) {
            // We'll need to determine which team this was for
            // For now, assume alternating based on team IDs
            if (match.home_score !== null) {
              homeWins++;
            }
          }
        } else if (homeScore === awayScore) {
          draws++;
        } else {
          awayWins++;
        }
      });

      // Calculate averages
      const h2hHomeGoalsAvg = totalHomeGoals / h2hMatchesPlayed;
      const h2hAwayGoalsAvg = totalAwayGoals / h2hMatchesPlayed;
      const h2hTotalGoalsAvg = (totalHomeGoals + totalAwayGoals) / h2hMatchesPlayed;

      // Recent H2H (last 5)
      const recentH2h = h2hMatches.slice(0, 5);
      const recentStats = this.calculateH2HStats(recentH2h);

      // Calculate H2H trend
      const h2hTrend = this.calculateH2HTrend(h2hMatches);

      return {
        h2h_matches_played: h2hMatchesPlayed,
        h2h_home_wins: homeWins,
        h2h_draws: draws,
        h2h_away_wins: awayWins,
        h2h_home_goals_avg: h2hHomeGoalsAvg,
        h2h_away_goals_avg: h2hAwayGoalsAvg,
        h2h_total_goals_avg: h2hTotalGoalsAvg,
        recent_h2h_home_wins: recentStats.homeWins,
        recent_h2h_draws: recentStats.draws,
        recent_h2h_away_wins: recentStats.awayWins,
        h2h_trend: h2hTrend,
        venue_h2h_home_wins: 0, // Would need venue-specific H2H
        venue_h2h_matches: 0
      };

    } catch (error) {
      logger.error('Error generating H2H features:', error);
      throw error;
    }
  }

  /**
   * Generate external factors
   */
  private async generateExternalFactors(homeTeamId: number, awayTeamId: number): Promise<ExternalFactors> {
    try {
      // Get team information for external factors
      const homeTeam = await db.query('SELECT * FROM teams WHERE id = $1', [homeTeamId]);
      const awayTeam = await db.query('SELECT * FROM teams WHERE id = $1', [awayTeamId]);

      // Placeholder implementations - would be enhanced with real data
      const weatherCondition = 7; // Good weather default
      const temperature = 20; // 20°C default
      
      // Mock attendance data
      const expectedAttendance = 50000;
      const attendancePercentage = 85;
      
      // Referee impact (placeholder)
      const refereeHomeFavorBias = 0.1; // Slight home bias
      const refereeAvgCardsPerGame = 3.5;
      const refereeAvgPenaltiesPerGame = 0.8;
      
      // Motivation based on league position and match importance
      const homeMotivation = this.calculateTeamMotivation(homeTeam.rows[0]);
      const awayMotivation = this.calculateTeamMotivation(awayTeam.rows[0]);
      
      // Key players missing (placeholder)
      const homeKeyPlayersMissing = 5;
      const awayKeyPlayersMissing = 3;

      return {
        weather_condition: weatherCondition,
        temperature: temperature,
        expected_attendance: expectedAttendance,
        attendance_percentage: attendancePercentage,
        referee_home_favor_bias: refereeHomeFavorBias,
        referee_avg_cards_per_game: refereeAvgCardsPerGame,
        referee_avg_penalties_per_game: refereeAvgPenaltiesPerGame,
        home_team_motivation: homeMotivation,
        away_team_motivation: awayMotivation,
        home_team_key_players_missing: homeKeyPlayersMissing,
        away_team_key_players_missing: awayKeyPlayersMissing
      };

    } catch (error) {
      logger.error('Error generating external factors:', error);
      throw error;
    }
  }

  // Helper methods

  private async getRecentForm(teamId: number, games: number): Promise<string[]> {
    // This would get actual form from matches table
    // For now, return placeholder
    return Array(games).fill('W').concat(Array(games).fill('D')).slice(0, games);
  }

  private calculateFormStats(form: string[]) {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    
    form.forEach(result => {
      switch (result) {
        case 'W': wins++; goalsFor += 2; goalsAgainst += 1; break;
        case 'D': draws++; goalsFor += 1; goalsAgainst += 1; break;
        case 'L': losses++; goalsFor += 1; goalsAgainst += 2; break;
      }
    });

    return {
      wins,
      draws,
      losses,
      points: wins * 3 + draws,
      goalsFor,
      goalsAgainst
    };
  }

  private async getHomeAwayStats(teamId: number, venue: 'home' | 'away') {
    // Placeholder - would calculate from actual match data
    return {
      winsPercentage: 50,
      goalsPerGame: 1.5,
      concededPerGame: 1.0
    };
  }

  private calculateStreaks(form: string[]) {
    let currentStreak = 1;
    let streakType = 'none';
    let longestWin = 0, longestLoss = 0;
    let currentWinStreak = 0, currentLossStreak = 0;

    for (let i = 0; i < form.length; i++) {
      if (form[i] === 'W') {
        currentWinStreak++;
        currentLossStreak = 0;
        longestWin = Math.max(longestWin, currentWinStreak);
        streakType = currentStreak === 1 ? 'win' : streakType;
        currentStreak++;
      } else if (form[i] === 'L') {
        currentLossStreak++;
        currentWinStreak = 0;
        longestLoss = Math.max(longestLoss, currentLossStreak);
        streakType = currentStreak === 1 ? 'loss' : streakType;
        currentStreak++;
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
        streakType = currentStreak === 1 ? 'draw' : streakType;
        currentStreak = 1; // Reset streak counter for draws
      }
    }

    return {
      type: streakType as 'win' | 'draw' | 'loss' | 'none',
      length: streakType === 'none' ? 0 : currentStreak - 1,
      longestWin,
      longestLoss
    };
  }

  private calculatePerformanceTrend(form: string[]) {
    // Calculate trend based on recent form
    let trend = 0;
    for (let i = 0; i < form.length - 1; i++) {
      const current = form[i];
      const next = form[i + 1];
      
      if (current === 'W' && next !== 'L') trend += 1;
      else if (current === 'L' && next === 'W') trend += 1;
      else if (current === next) trend += 0.5;
      else trend -= 1;
    }
    
    return trend / (form.length - 1);
  }

  private async calculateLeagueStrength(teamId: number) {
    // Placeholder - would calculate from league table
    return {
      rating: 7.5, // 1-10 scale
      relativeStrength: 1.2 // vs league average
    };
  }

  private async getLeagueAverages() {
    return {
      avgGoalsPerGame: 2.5,
      avgHomeAdvantage: 0.15
    };
  }

  private calculateMatchImportance(homeTeamId: number, awayTeamId: number): number {
    // Calculate based on league positions, rivalry, etc.
    return 3; // Medium importance
  }

  private calculateH2HStats(matches: any[]) {
    // Placeholder H2H calculation
    return {
      homeWins: 0,
      draws: 0,
      awayWins: 0
    };
  }

  private calculateH2HTrend(matches: any[]): number {
    // Calculate trend in H2H results
    return 0;
  }

  private calculateTeamMotivation(team: any): number {
    // Motivation based on league position, recent form, etc.
    return 7; // 1-10 scale
  }

  private countFeatures(features: MatchFeatures): number {
    let count = 0;
    
    // Count all features
    const teamFeatureCount = Object.keys(features.home_team_features).length;
    const matchFeatureCount = Object.keys(features.match_features).length;
    const h2hFeatureCount = Object.keys(features.head_to_head_features).length;
    const externalFeatureCount = Object.keys(features.external_features).length;
    
    count = (teamFeatureCount * 2) + matchFeatureCount + h2hFeatureCount + externalFeatureCount;
    
    return count;
  }
}