import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { MLPredictionService } from '../services/MLPredictionService';

// Mock predictions data
let predictions: any[] = [];
let nextPredictionId = 1;

// Mock teams and matches data
const mockTeams = [
  { id: 1, name: 'Manchester United', league: 'Premier League', position: 1, points: 45, form: 'WWDWL' },
  { id: 2, name: 'Liverpool', league: 'Premier League', position: 2, points: 42, form: 'WLWWL' },
  { id: 3, name: 'Real Madrid', league: 'La Liga', position: 1, points: 48, form: 'WWWWL' }
];

export class PredictionController {
  private mlPredictionService: MLPredictionService;

  constructor() {
    this.mlPredictionService = new MLPredictionService();
  }

  /**
   * Generate a match prediction using advanced ML ensemble
   */
  generateAdvancedMLPrediction = asyncHandler(async (req: Request, res: Response) => {
    const { homeTeamId, awayTeamId, league, matchDate, includeHistoricalAnalysis = true } = req.body;
    
    logger.info('Generating advanced ML prediction', { homeTeamId, awayTeamId, league });

    try {
      const mlRequest = {
        homeTeamId: parseInt(homeTeamId),
        awayTeamId: parseInt(awayTeamId),
        league,
        matchDate: matchDate ? new Date(matchDate) : undefined,
        includeHistoricalAnalysis
      };

      const mlResponse = await this.mlPredictionService.generateMLPrediction(mlRequest);

      res.status(200).json({
        success: true,
        data: mlResponse,
        message: 'Advanced ML prediction generated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error generating advanced ML prediction:', error);
      throw error;
    }
  });

  /**
   * Generate batch predictions for multiple matches
   */
  generateBatchPredictions = asyncHandler(async (req: Request, res: Response) => {
    const { matches } = req.body;
    
    logger.info('Generating batch predictions', { matchCount: matches?.length });

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      throw new ValidationError('Matches array is required and must not be empty');
    }

    if (matches.length > 20) {
      throw new ValidationError('Maximum 20 matches allowed per batch');
    }

    try {
      const batchRequests = matches.map((match: any) => ({
        homeTeamId: parseInt(match.homeTeamId),
        awayTeamId: parseInt(match.awayTeamId),
        league: match.league,
        matchDate: match.matchDate ? new Date(match.matchDate) : undefined
      }));

      const batchResults = await this.mlPredictionService.generateBatchPredictions(batchRequests);

      res.status(200).json({
        success: true,
        data: {
          predictions: batchResults,
          summary: {
            total_matches: batchResults.length,
            avg_confidence: batchResults.reduce((sum, p) => sum + p.prediction.confidence_score, 0) / batchResults.length,
            high_confidence_count: batchResults.filter(p => p.prediction.is_high_confidence).length,
            processing_time_total: batchResults.reduce((sum, p) => sum + p.processing_time_ms, 0)
          }
        },
        message: `Generated ${batchResults.length} predictions successfully`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error generating batch predictions:', error);
      throw error;
    }
  });

  /**
   * Get prediction history and accuracy tracking
   */
  getPredictionHistory = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50 } = req.query;
    
    logger.info('Getting prediction history', { limit });

    try {
      const history = await this.mlPredictionService.getPredictionHistory(parseInt(limit as string));

      // Calculate additional metrics
      const accuracyMetrics = {
        total_predictions: history.length,
        correct_predictions: history.filter(h => h.was_correct === 1).length,
        accuracy_rate: history.length > 0 ? 
          history.filter(h => h.was_correct === 1).length / history.length : 0,
        avg_confidence: history.length > 0 ?
          history.reduce((sum, h) => sum + parseFloat(h.confidence_score), 0) / history.length : 0
      };

      res.status(200).json({
        success: true,
        data: {
          predictions: history,
          metrics: accuracyMetrics
        },
        message: 'Prediction history retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting prediction history:', error);
      throw error;
    }
  });

  /**
   * Get prediction accuracy statistics
   */
  getAccuracyStats = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Getting prediction accuracy stats');

    try {
      const stats = await this.mlPredictionService.getAccuracyStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Accuracy statistics retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting accuracy stats:', error);
      throw error;
    }
  });

  /**
   * Generate a match prediction using basic ML algorithm
   */
  generatePrediction = asyncHandler(async (req: Request, res: Response) => {
    const { home_team_id, away_team_id, match_date, league } = req.body;
    logger.info('Generating prediction', { home_team_id, away_team_id, league });

    // Validate teams exist
    const homeTeam = mockTeams.find(team => team.id === home_team_id);
    const awayTeam = mockTeams.find(team => team.id === away_team_id);

    if (!homeTeam) {
      throw new NotFoundError(`Home team with ID ${home_team_id} not found`);
    }

    if (!awayTeam) {
      throw new NotFoundError(`Away team with ID ${away_team_id} not found`);
    }

    // Generate prediction using simple algorithm
    const prediction = this.calculatePrediction(homeTeam, awayTeam, match_date, league);

    // Store prediction (in production, this would go to database)
    const predictionRecord = {
      id: nextPredictionId++,
      uuid: `750e8400-e29b-41d4-a716-44665544000${nextPredictionId}`,
      match_id: null, // This would be set when the match is created
      home_team_id,
      away_team_id,
      ...prediction,
      created_at: new Date()
    };

    predictions.push(predictionRecord);

    logger.info('Prediction generated successfully', { 
      id: predictionRecord.id, 
      confidence: prediction.confidence_score,
      predicted_outcome: prediction.predicted_outcome
    });

    res.status(200).json({
      success: true,
      data: {
        ...predictionRecord,
        match_info: {
          home_team: homeTeam,
          away_team: awayTeam,
          league,
          match_date
        },
        confidence_level: this.getConfidenceLevel(prediction.confidence_score)
      },
      message: 'Prediction generated successfully',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get prediction by match ID
   */
  getPredictionByMatchId = asyncHandler(async (req: Request, res: Response) => {
    const { matchId } = req.params;
    logger.info('Getting prediction for match', { matchId });

    // For demo purposes, we'll create a mock prediction
    const homeTeamId = parseInt(matchId) % 3 + 1;
    const awayTeamId = (parseInt(matchId) + 1) % 3 + 1;
    const homeTeam = mockTeams.find(t => t.id === homeTeamId);
    const awayTeam = mockTeams.find(t => t.id === awayTeamId);

    const prediction = this.calculatePrediction(homeTeam, awayTeam, new Date(), 'Premier League');

    res.status(200).json({
      success: true,
      data: {
        match_id: parseInt(matchId),
        ...prediction,
        match_info: {
          home_team: homeTeam,
          away_team: awayTeam
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get all predictions with filtering
   */
  getAllPredictions = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Getting all predictions', { query: req.query });

    const { league, model_version, is_high_confidence, limit = 50 } = req.query;

    // Generate mock predictions for demonstration
    let mockPredictions = [];
    for (let i = 0; i < Math.min(parseInt(limit as string), 20); i++) {
      const homeTeam = mockTeams[i % mockTeams.length];
      const awayTeam = mockTeams[(i + 1) % mockTeams.length];
      
      const prediction = this.calculatePrediction(homeTeam, awayTeam, new Date(), league || homeTeam.league);
      
      mockPredictions.push({
        id: i + 1,
        match_id: i + 1,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        ...prediction,
        created_at: new Date(Date.now() - i * 3600000), // Spread over time
        match_info: {
          home_team: homeTeam,
          away_team: awayTeam,
          league: prediction.league
        }
      });
    }

    // Apply filters
    if (league) {
      mockPredictions = mockPredictions.filter(p => p.league === league);
    }

    if (model_version) {
      mockPredictions = mockPredictions.filter(p => p.model_version === model_version);
    }

    if (is_high_confidence === 'true') {
      mockPredictions = mockPredictions.filter(p => p.is_high_confidence);
    }

    res.status(200).json({
      success: true,
      data: mockPredictions,
      summary: {
        total_predictions: mockPredictions.length,
        high_confidence_count: mockPredictions.filter(p => p.is_high_confidence).length,
        avg_confidence: mockPredictions.reduce((sum, p) => sum + p.confidence_score, 0) / mockPredictions.length
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get prediction analytics
   */
  getPredictionAnalytics = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Getting prediction analytics');

    // Mock analytics data
    const analytics = {
      overall_performance: {
        total_predictions: 150,
        accuracy_rate: 0.78, // 78% accuracy
        high_confidence_predictions: 89,
        avg_confidence: 0.72
      },
      model_performance: {
        xgboost: { accuracy: 0.82, count: 60 },
        random_forest: { accuracy: 0.76, count: 45 },
        ensemble: { accuracy: 0.85, count: 45 }
      },
      league_performance: {
        'Premier League': { accuracy: 0.80, predictions: 40 },
        'La Liga': { accuracy: 0.75, predictions: 35 },
        'Serie A': { accuracy: 0.78, predictions: 30 },
        'Bundesliga': { accuracy: 0.82, predictions: 25 },
        'Ligue 1': { accuracy: 0.73, predictions: 20 }
      },
      confidence_distribution: {
        high: 89, // > 0.8 confidence
        medium: 45, // 0.6 - 0.8 confidence
        low: 16 // < 0.6 confidence
      },
      prediction_trends: [
        { date: '2025-11-01', accuracy: 0.75, confidence: 0.70 },
        { date: '2025-11-05', accuracy: 0.80, confidence: 0.72 },
        { date: '2025-11-10', accuracy: 0.78, confidence: 0.71 },
        { date: '2025-11-12', accuracy: 0.82, confidence: 0.75 }
      ]
    };

    res.status(200).json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Calculate prediction using basic algorithm
   */
  private calculatePrediction(homeTeam: any, awayTeam: any, matchDate: string, league: string) {
    // Basic prediction algorithm (this will be replaced with actual ML models)
    
    // Home advantage factor
    const homeAdvantage = 0.15; // 15% advantage for home team
    
    // Form factor (convert form to numerical value)
    const formValues = { 'W': 1, 'D': 0.5, 'L': 0 };
    const homeFormScore = homeTeam.form.split('').slice(0, 5).reduce((sum, result) => 
      sum + formValues[result as keyof typeof formValues], 0) / 5;
    
    const awayFormScore = awayTeam.form.split('').slice(0, 5).reduce((sum, result) => 
      sum + formValues[result as keyof typeof formValues], 0) / 5;
    
    // League position factor (lower position = better team)
    const positionFactor = (21 - homeTeam.position) / 20 - (21 - awayTeam.position) / 20;
    
    // Points per game factor
    const homePpg = homeTeam.points / Math.max(homeTeam.played_games || 10, 1);
    const awayPpg = awayTeam.points / Math.max(awayTeam.played_games || 10, 1);
    
    // Calculate base probabilities
    let homeWinProb = 0.33 + homeAdvantage + (homeFormScore - awayFormScore) * 0.1 + positionFactor * 0.05 + (homePpg - awayPpg) * 0.1;
    let awayWinProb = 0.33 - homeAdvantage + (awayFormScore - homeFormScore) * 0.1 - positionFactor * 0.05 + (awayPpg - homePpg) * 0.1;
    let drawProb = 0.34;
    
    // Normalize probabilities to sum to 1
    const total = homeWinProb + drawProb + awayWinProb;
    homeWinProb /= total;
    awayWinProb /= total;
    drawProb /= total;
    
    // Determine predicted outcome
    const maxProb = Math.max(homeWinProb, drawProb, awayWinProb);
    let predicted_outcome;
    if (maxProb === homeWinProb) predicted_outcome = 'home_win';
    else if (maxProb === awayWinProb) predicted_outcome = 'away_win';
    else predicted_outcome = 'draw';
    
    // Calculate confidence score
    const confidence_score = maxProb;
    const is_high_confidence = confidence_score > 0.75;
    
    return {
      predicted_outcome,
      predicted_probabilities: {
        home_win: Math.round(homeWinProb * 1000) / 1000,
        draw: Math.round(drawProb * 1000) / 1000,
        away_win: Math.round(awayWinProb * 1000) / 1000
      },
      confidence_score: Math.round(confidence_score * 1000) / 1000,
      model_version: 'v1.0.0',
      model_name: 'ensemble',
      is_high_confidence,
      features_used: [
        'home_advantage',
        'team_form',
        'league_position',
        'points_per_game',
        'head_to_head'
      ],
      prediction_reasons: this.generatePredictionReasons(homeTeam, awayTeam, predicted_outcome, confidence_score),
      weather_impact: 0.02, // Mock weather impact
      travel_impact: 0.03,  // Mock travel impact
      rest_days_impact: 0.01, // Mock rest days impact
      injury_impact: 0.05, // Mock injury impact
      league
    };
  }

  /**
   * Generate prediction reasons
   */
  private generatePredictionReasons(homeTeam: any, awayTeam: any, outcome: string, confidence: number): string[] {
    const reasons = [];
    
    if (outcome === 'home_win') {
      reasons.push(`${homeTeam.name} has home advantage`);
      reasons.push(`${homeTeam.name} has better recent form than ${awayTeam.name}`);
    } else if (outcome === 'away_win') {
      reasons.push(`${awayTeam.name} has been in better form recently`);
      reasons.push(`${awayTeam.name} has superior league position`);
    } else {
      reasons.push('Both teams have similar recent form');
      reasons.push('Historical head-to-head suggests a close match');
    }
    
    if (confidence > 0.8) {
      reasons.push('High confidence prediction due to strong data signals');
    } else if (confidence < 0.6) {
      reasons.push('Lower confidence due to limited data or conflicting indicators');
    }
    
    return reasons;
  }

  /**
   * Get confidence level string
   */
  private getConfidenceLevel(confidence: number): string {
    if (confidence > 0.8) return 'High';
    if (confidence > 0.6) return 'Medium';
    return 'Low';
  }
}