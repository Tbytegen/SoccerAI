/**
 * Machine Learning Models Service
 * Implements ensemble ML models for soccer prediction
 */

import { logger } from '../utils/logger';
import { MatchFeatures } from './FeatureEngineeringService';

// TypeScript interfaces for ML models
export interface PredictionResult {
  predicted_outcome: 'home_win' | 'draw' | 'away_win';
  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  confidence_score: number;
  model_predictions: {
    xgboost: ModelPrediction;
    random_forest: ModelPrediction;
    neural_network: ModelPrediction;
    ensemble: ModelPrediction;
  };
  feature_importance: FeatureImportance[];
  reasoning: string[];
}

export interface ModelPrediction {
  outcome: 'home_win' | 'draw' | 'away_win';
  confidence: number;
  probability: number;
}

export interface FeatureImportance {
  feature_name: string;
  importance_score: number;
  model_contribution: {
    xgboost: number;
    random_forest: number;
    neural_network: number;
  };
}

export interface ModelMetrics {
  accuracy: number;
  precision: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  recall: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  f1_score: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  overall_f1: number;
  auc_roc: number;
}

export class MachineLearningModelsService {
  
  // Model weights for ensemble (can be tuned)
  private modelWeights = {
    xgboost: 0.4,
    random_forest: 0.3,
    neural_network: 0.3
  };

  // Feature weights for importance calculation
  private featureWeights = {
    // Team form features (high importance)
    'home_team_features.form_points_last_5': 0.15,
    'home_team_features.goals_per_game': 0.12,
    'away_team_features.form_points_last_5': 0.12,
    'away_team_features.goals_per_game': 0.10,
    
    // League position
    'home_team_features.league_position': 0.08,
    'away_team_features.league_position': 0.08,
    
    // Home advantage
    'match_features.league_avg_home_advantage': 0.06,
    'home_team_features.home_wins_percentage': 0.05,
    
    // Head-to-head
    'head_to_head_features.h2h_home_wins': 0.04,
    'head_to_head_features.h2h_total_goals_avg': 0.03,
    
    // Rest and schedule
    'match_features.days_since_last_match': 0.03,
    'match_features.matches_in_last_14_days': 0.02
  };

  /**
   * Generate prediction using ensemble of ML models
   */
  async generatePrediction(features: MatchFeatures): Promise<PredictionResult> {
    try {
      logger.info('Generating ML prediction with ensemble models');
      
      // Convert features to model input format
      const featureVector = this.featuresToVector(features);
      
      // Generate predictions from each model
      const modelPredictions = await Promise.all([
        this.predictWithXGBoost(featureVector, features),
        this.predictWithRandomForest(featureVector, features),
        this.predictWithNeuralNetwork(featureVector, features)
      ]);

      const [xgboostPred, rfPred, nnPred] = modelPredictions;
      
      // Create ensemble prediction
      const ensemblePrediction = this.createEnsemblePrediction(
        xgboostPred, rfPred, nnPred, features
      );
      
      // Calculate feature importance
      const featureImportance = this.calculateFeatureImportance(features, modelPredictions);
      
      // Generate reasoning
      const reasoning = this.generateReasoning(features, ensemblePrediction, featureImportance);

      const result: PredictionResult = {
        predicted_outcome: ensemblePrediction.outcome,
        probabilities: {
          home_win: ensemblePrediction.homeWinProb,
          draw: ensemblePrediction.drawProb,
          away_win: ensemblePrediction.awayWinProb
        },
        confidence_score: ensemblePrediction.confidence,
        model_predictions: {
          xgboost: xgboostPred,
          random_forest: rfPred,
          neural_network: nnPred,
          ensemble: {
            outcome: ensemblePrediction.outcome,
            confidence: ensemblePrediction.confidence,
            probability: Math.max(ensemblePrediction.homeWinProb, ensemblePrediction.drawProb, ensemblePrediction.awayWinProb)
          }
        },
        feature_importance: featureImportance,
        reasoning: reasoning
      };

      logger.info(`ML prediction generated: ${result.predicted_outcome} (${result.confidence_score.toFixed(3)} confidence)`);
      return result;
      
    } catch (error) {
      logger.error('Error generating ML prediction:', error);
      throw error;
    }
  }

  /**
   * XGBoost prediction (simplified implementation)
   */
  private async predictWithXGBoost(
    featureVector: number[], 
    features: MatchFeatures
  ): Promise<ModelPrediction> {
    try {
      // Simplified XGBoost-like logic using decision trees
      let homeScore = 0;
      let drawScore = 0;
      let awayScore = 0;

      // Tree 1: Team form comparison
      const homeFormScore = features.home_team_features.form_points_last_5;
      const awayFormScore = features.away_team_features.form_points_last_5;
      const formDifference = homeFormScore - awayFormScore;
      
      if (formDifference > 3) {
        homeScore += 0.3;
      } else if (formDifference < -3) {
        awayScore += 0.3;
      } else {
        drawScore += 0.1;
      }

      // Tree 2: Goal difference comparison
      const homeGD = features.home_team_features.goal_difference_per_game;
      const awayGD = features.away_team_features.goal_difference_per_game;
      const gdDifference = homeGD - awayGD;
      
      if (gdDifference > 0.5) {
        homeScore += 0.25;
      } else if (gdDifference < -0.5) {
        awayScore += 0.25;
      }

      // Tree 3: League position impact
      const positionDifference = features.away_team_features.league_position - features.home_team_features.league_position;
      if (positionDifference > 3) {
        homeScore += 0.2;
      } else if (positionDifference < -3) {
        awayScore += 0.2;
      }

      // Tree 4: Home advantage
      const homeAdvantage = 0.15; // Standard home advantage
      homeScore += homeAdvantage * features.match_features.league_avg_home_advantage;

      // Tree 5: Recent performance trends
      const homeTrend = features.home_team_features.performance_trend_5;
      const awayTrend = features.away_team_features.performance_trend_5;
      const trendDifference = homeTrend - awayTrend;
      
      if (trendDifference > 1) {
        homeScore += 0.15;
      } else if (trendDifference < -1) {
        awayScore += 0.15;
      }

      // Normalize scores to probabilities
      const totalScore = homeScore + drawScore + awayScore + 0.2; // Base draw probability
      
      const homeProb = Math.min(0.9, Math.max(0.05, homeScore / totalScore));
      const awayProb = Math.min(0.9, Math.max(0.05, awayScore / totalScore));
      const drawProb = Math.min(0.6, Math.max(0.05, 0.2 / totalScore));

      // Normalize to sum to 1
      const sum = homeProb + drawProb + awayProb;
      const normalizedHome = homeProb / sum;
      const normalizedDraw = drawProb / sum;
      const normalizedAway = awayProb / sum;

      // Determine prediction
      let prediction: 'home_win' | 'draw' | 'away_win';
      let confidence: number;

      if (normalizedHome > normalizedDraw && normalizedHome > normalizedAway) {
        prediction = 'home_win';
        confidence = normalizedHome;
      } else if (normalizedAway > normalizedHome && normalizedAway > normalizedDraw) {
        prediction = 'away_win';
        confidence = normalizedAway;
      } else {
        prediction = 'draw';
        confidence = normalizedDraw;
      }

      return {
        outcome: prediction,
        confidence: confidence,
        probability: confidence
      };

    } catch (error) {
      logger.error('Error in XGBoost prediction:', error);
      // Fallback prediction
      return {
        outcome: 'home_win',
        confidence: 0.33,
        probability: 0.33
      };
    }
  }

  /**
   * Random Forest prediction (simplified implementation)
   */
  private async predictWithRandomForest(
    featureVector: number[], 
    features: MatchFeatures
  ): Promise<ModelPrediction> {
    try {
      // Create multiple decision trees (simplified Random Forest)
      const trees = [
        this.createDecisionTree1(features),
        this.createDecisionTree2(features),
        this.createDecisionTree3(features),
        this.createDecisionTree4(features),
        this.createDecisionTree5(features)
      ];

      // Aggregate predictions from all trees
      let homeVotes = 0;
      let drawVotes = 0;
      let awayVotes = 0;

      trees.forEach(tree => {
        switch (tree) {
          case 'home_win': homeVotes++; break;
          case 'draw': drawVotes++; break;
          case 'away_win': awayVotes++; break;
        }
      });

      // Convert votes to probabilities
      const totalTrees = trees.length;
      const homeProb = homeVotes / totalTrees;
      const drawProb = drawVotes / totalTrees;
      const awayProb = awayVotes / totalTrees;

      // Determine prediction
      let prediction: 'home_win' | 'draw' | 'away_win';
      let confidence: number;

      if (homeProb > drawProb && homeProb > awayProb) {
        prediction = 'home_win';
        confidence = homeProb;
      } else if (awayProb > homeProb && awayProb > drawProb) {
        prediction = 'away_win';
        confidence = awayProb;
      } else {
        prediction = 'draw';
        confidence = drawProb;
      }

      return {
        outcome: prediction,
        confidence: confidence,
        probability: confidence
      };

    } catch (error) {
      logger.error('Error in Random Forest prediction:', error);
      return {
        outcome: 'draw',
        confidence: 0.33,
        probability: 0.33
      };
    }
  }

  /**
   * Neural Network prediction (simplified implementation)
   */
  private async predictWithNeuralNetwork(
    featureVector: number[], 
    features: MatchFeatures
  ): Promise<ModelPrediction> {
    try {
      // Simplified neural network with 3 layers
      
      // Input layer (normalized features)
      const inputs = this.normalizeFeatures(features);
      
      // Hidden layer 1 (8 neurons)
      const hidden1 = this.sigmoidLayer(
        this.multiplyMatrix(inputs, [
          0.3, -0.2, 0.1, 0.4, -0.1, 0.2, 0.0, -0.3, 0.2, 0.1,  // Form features
          0.1, 0.2, -0.1, 0.3, 0.0, 0.1, 0.2, -0.2, 0.1, 0.0,  // Stats features
          0.2, 0.1, 0.0, -0.1, 0.3, 0.1, 0.2, 0.0, 0.1, 0.1,  // Match features
          0.1, 0.0, 0.2, -0.2, 0.1, 0.3, 0.1, 0.0, 0.2, 0.1   // H2H features
        ].slice(0, inputs.length * 8), 8)
      );

      // Hidden layer 2 (4 neurons)
      const hidden2 = this.sigmoidLayer(
        this.multiplyMatrix(hidden1, [
          0.4, 0.1, -0.2, 0.2,
          0.2, 0.3, 0.1, -0.1,
          0.1, 0.2, 0.4, 0.0,
          -0.1, 0.1, 0.2, 0.3,
          0.3, 0.0, 0.1, 0.2,
          0.2, 0.4, 0.0, 0.1,
          0.1, 0.1, 0.3, 0.2,
          0.0, 0.2, 0.1, 0.4
        ], 4)
      );

      // Output layer (3 neurons for home/draw/away)
      const outputs = this.softmaxLayer(
        this.multiplyMatrix(hidden2, [
          0.5, 0.2, 0.1,   // Home win
          0.2, 0.4, 0.2,   // Draw
          0.1, 0.2, 0.5    // Away win
        ], 3)
      );

      const homeProb = outputs[0];
      const drawProb = outputs[1];
      const awayProb = outputs[2];

      // Determine prediction
      let prediction: 'home_win' | 'draw' | 'away_win';
      let confidence: number;

      if (homeProb > drawProb && homeProb > awayProb) {
        prediction = 'home_win';
        confidence = homeProb;
      } else if (awayProb > homeProb && awayProb > drawProb) {
        prediction = 'away_win';
        confidence = awayProb;
      } else {
        prediction = 'draw';
        confidence = drawProb;
      }

      return {
        outcome: prediction,
        confidence: confidence,
        probability: confidence
      };

    } catch (error) {
      logger.error('Error in Neural Network prediction:', error);
      return {
        outcome: 'home_win',
        confidence: 0.33,
        probability: 0.33
      };
    }
  }

  /**
   * Create ensemble prediction from individual model outputs
   */
  private createEnsemblePrediction(
    xgboost: ModelPrediction,
    randomForest: ModelPrediction,
    neuralNetwork: ModelPrediction,
    features: MatchFeatures
  ) {
    // Weighted ensemble of probabilities
    let homeWinProb = 0;
    let drawProb = 0;
    let awayWinProb = 0;

    // XGBoost contribution
    if (xgboost.outcome === 'home_win') homeWinProb += this.modelWeights.xgboost * xgboost.probability;
    else if (xgboost.outcome === 'draw') drawProb += this.modelWeights.xgboost * xgboost.probability;
    else awayWinProb += this.modelWeights.xgboost * xgboost.probability;

    // Random Forest contribution
    if (randomForest.outcome === 'home_win') homeWinProb += this.modelWeights.random_forest * randomForest.probability;
    else if (randomForest.outcome === 'draw') drawProb += this.modelWeights.random_forest * randomForest.probability;
    else awayWinProb += this.modelWeights.random_forest * randomForest.probability;

    // Neural Network contribution
    if (neuralNetwork.outcome === 'home_win') homeWinProb += this.modelWeights.neural_network * neuralNetwork.probability;
    else if (neuralNetwork.outcome === 'draw') drawProb += this.modelWeights.neural_network * neuralNetwork.probability;
    else awayWinProb += this.modelWeights.neural_network * neuralNetwork.probability;

    // Add Bayesian adjustment for home advantage
    const homeAdvantage = features.match_features.league_avg_home_advantage * 0.1;
    homeWinProb += homeAdvantage;

    // Normalize probabilities
    const total = homeWinProb + drawProb + awayWinProb;
    homeWinProb /= total;
    drawProb /= total;
    awayWinProb /= total;

    // Determine final prediction
    let outcome: 'home_win' | 'draw' | 'away_win';
    let confidence: number;

    if (homeWinProb > drawProb && homeWinProb > awayWinProb) {
      outcome = 'home_win';
      confidence = homeWinProb;
    } else if (awayWinProb > homeWinProb && awayWinProb > drawProb) {
      outcome = 'away_win';
      confidence = awayWinProb;
    } else {
      outcome = 'draw';
      confidence = drawProb;
    }

    return {
      outcome,
      confidence,
      homeWinProb,
      drawProb,
      awayWinProb
    };
  }

  /**
   * Calculate feature importance
   */
  private calculateFeatureImportance(
    features: MatchFeatures,
    modelPredictions: ModelPrediction[]
  ): FeatureImportance[] {
    const importance: FeatureImportance[] = [];

    // Top features based on our domain knowledge
    const topFeatures = [
      'home_team_features.form_points_last_5',
      'away_team_features.form_points_last_5',
      'home_team_features.goals_per_game',
      'away_team_features.goals_per_game',
      'home_team_features.league_position',
      'away_team_features.league_position',
      'head_to_head_features.h2h_home_wins',
      'match_features.league_avg_home_advantage'
    ];

    topFeatures.forEach(featureName => {
      const baseWeight = this.featureWeights[featureName] || 0.01;
      
      importance.push({
        feature_name: featureName,
        importance_score: baseWeight,
        model_contribution: {
          xgboost: baseWeight * 1.2, // XGBoost typically better at feature importance
          random_forest: baseWeight * 1.0,
          neural_network: baseWeight * 0.8
        }
      });
    });

    return importance.sort((a, b) => b.importance_score - a.importance_score);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    features: MatchFeatures,
    prediction: any,
    importance: FeatureImportance[]
  ): string[] {
    const reasoning: string[] = [];

    // Analyze key factors
    const homeForm = features.home_team_features.form_points_last_5;
    const awayForm = features.away_team_features.form_points_last_5;
    
    if (Math.abs(homeForm - awayForm) > 3) {
      if (homeForm > awayForm) {
        reasoning.push(`Home team is in much better form (${homeForm} vs ${awayForm} points in last 5 games)`);
      } else {
        reasoning.push(`Away team is in much better form (${awayForm} vs ${homeForm} points in last 5 games)`);
      }
    }

    // League position impact
    const posDiff = features.away_team_features.league_position - features.home_team_features.league_position;
    if (posDiff > 5) {
      reasoning.push(`Significant league position advantage for home team (+${posDiff} positions)`);
    } else if (posDiff < -5) {
      reasoning.push(`Significant league position advantage for away team (+${Math.abs(posDiff)} positions)`);
    }

    // Home advantage
    const homeAdvantage = features.match_features.league_avg_home_advantage;
    if (homeAdvantage > 0.1) {
      reasoning.push(`Strong home advantage in this league (${(homeAdvantage * 100).toFixed(1)}% win rate boost)`);
    }

    // Goal difference impact
    const homeGD = features.home_team_features.goal_difference_per_game;
    const awayGD = features.away_team_features.goal_difference_per_game;
    
    if (Math.abs(homeGD - awayGD) > 0.5) {
      if (homeGD > awayGD) {
        reasoning.push(`Home team has superior goal difference (+${homeGD.toFixed(2)} vs +${awayGD.toFixed(2)} per game)`);
      } else {
        reasoning.push(`Away team has superior goal difference (+${awayGD.toFixed(2)} vs +${homeGD.toFixed(2)} per game)`);
      }
    }

    // H2H history
    if (features.head_to_head_features.h2h_matches_played > 0) {
      const h2hAdvantage = features.head_to_head_features.h2h_home_wins / features.head_to_head_features.h2h_matches_played;
      if (h2hAdvantage > 0.6) {
        reasoning.push(`Home team historically dominant in head-to-head meetings (${(h2hAdvantage * 100).toFixed(0)}% wins)`);
      } else if (h2hAdvantage < 0.4) {
        reasoning.push(`Away team has good head-to-head record against home team`);
      }
    }

    // Add confidence level explanation
    if (prediction.confidence > 0.7) {
      reasoning.push(`High confidence prediction based on multiple strong indicators`);
    } else if (prediction.confidence < 0.4) {
      reasoning.push(`Low confidence prediction - teams are closely matched`);
    }

    return reasoning;
  }

  // Helper methods for neural network

  private featuresToVector(features: MatchFeatures): number[] {
    // Convert features object to flat numerical array
    const vector: number[] = [];
    
    // Add team features (simplified)
    const homeFeatures = Object.values(features.home_team_features);
    const awayFeatures = Object.values(features.away_team_features);
    const matchFeatures = Object.values(features.match_features);
    const h2hFeatures = Object.values(features.head_to_head_features);
    
    return [...homeFeatures, ...awayFeatures, ...matchFeatures, ...h2hFeatures]
      .filter(val => typeof val === 'number') as number[];
  }

  private normalizeFeatures(features: MatchFeatures): number[] {
    // Simple normalization to 0-1 range
    const vector = this.featuresToVector(features);
    return vector.map(val => Math.min(1, Math.max(0, val / 10))); // Assuming max values around 10
  }

  private sigmoidLayer(inputs: number[]): number[] {
    return inputs.map(x => 1 / (1 + Math.exp(-x)));
  }

  private softmaxLayer(inputs: number[]): number[] {
    const max = Math.max(...inputs);
    const exp = inputs.map(x => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(x => x / sum);
  }

  private multiplyMatrix(inputs: number[], weights: number[], outputSize: number): number[] {
    const outputs = new Array(outputSize).fill(0);
    
    for (let i = 0; i < outputSize; i++) {
      for (let j = 0; j < inputs.length; j++) {
        const weightIndex = i * inputs.length + j;
        if (weightIndex < weights.length) {
          outputs[i] += inputs[j] * weights[weightIndex];
        }
      }
    }
    
    return outputs;
  }

  // Decision trees for Random Forest

  private createDecisionTree1(features: MatchFeatures): 'home_win' | 'draw' | 'away_win' {
    const homeForm = features.home_team_features.form_points_last_5;
    const awayForm = features.away_team_features.form_points_last_5;
    
    if (homeForm > awayForm + 2) return 'home_win';
    if (awayForm > homeForm + 2) return 'away_win';
    return 'draw';
  }

  private createDecisionTree2(features: MatchFeatures): 'home_win' | 'draw' | 'away_win' {
    const homePosition = features.home_team_features.league_position;
    const awayPosition = features.away_team_features.league_position;
    
    if (homePosition + 3 < awayPosition) return 'home_win';
    if (awayPosition + 3 < homePosition) return 'away_win';
    return 'draw';
  }

  private createDecisionTree3(features: MatchFeatures): 'home_win' | 'draw' | 'away_win' {
    const homeGoals = features.home_team_features.goals_per_game;
    const awayGoals = features.away_team_features.goals_per_game;
    
    if (homeGoals > awayGoals + 0.5) return 'home_win';
    if (awayGoals > homeGoals + 0.5) return 'away_win';
    return 'draw';
  }

  private createDecisionTree4(features: MatchFeatures): 'home_win' | 'draw' | 'away_win' {
    const homeAdvantage = features.match_features.league_avg_home_advantage;
    
    if (homeAdvantage > 0.15) return 'home_win';
    if (homeAdvantage < 0.05) return 'away_win';
    return 'draw';
  }

  private createDecisionTree5(features: MatchFeatures): 'home_win' | 'draw' | 'away_win' {
    const homeStreak = features.home_team_features.current_streak_length;
    const awayStreak = features.away_team_features.current_streak_length;
    
    if (homeStreak > 3) return 'home_win';
    if (awayStreak > 3) return 'away_win';
    return 'draw';
  }

  /**
   * Get model performance metrics (placeholder)
   */
  async getModelMetrics(): Promise<ModelMetrics> {
    // Placeholder metrics - would be calculated from actual training data
    return {
      accuracy: 0.78,
      precision: {
        home_win: 0.82,
        draw: 0.65,
        away_win: 0.79
      },
      recall: {
        home_win: 0.75,
        draw: 0.58,
        away_win: 0.77
      },
      f1_score: {
        home_win: 0.78,
        draw: 0.61,
        away_win: 0.78
      },
      overall_f1: 0.72,
      auc_roc: 0.84
    };
  }
}