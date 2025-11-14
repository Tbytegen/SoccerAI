import { Router } from 'express';
import { PredictionController } from '../controllers/PredictionController';
import { validatePredictionRequest, validateBatchPredictionRequest } from '../middleware/validation';

const router = Router();
const predictionController = new PredictionController();

/**
 * @swagger
 * /api/predictions/generate:
 *   post:
 *     summary: Generate match prediction
 *     description: Generate a prediction for a specific match using ML models
 *     tags: [Predictions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - home_team_id
 *               - away_team_id
 *               - match_date
 *               - league
 *             properties:
 *               home_team_id:
 *                 type: integer
 *                 description: ID of the home team
 *                 example: 1
 *               away_team_id:
 *                 type: integer
 *                 description: ID of the away team
 *                 example: 2
 *               match_date:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled match date and time
 *                 example: "2025-11-15T15:00:00Z"
 *               league:
 *                 type: string
 *                 description: League the match is played in
 *                 example: "Premier League"
 *     responses:
 *       200:
 *         description: Prediction generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Prediction'
 */
router.post('/generate', predictionController.generatePrediction);

/**
 * @swagger
 * /api/predictions/{matchId}:
 *   get:
 *     summary: Get prediction for specific match
 *     description: Retrieve the prediction for a specific match
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Prediction retrieved successfully
 */
router.get('/:matchId', predictionController.getPredictionByMatchId);

/**
 * @swagger
 * /api/predictions:
 *   get:
 *     summary: Get all predictions
 *     description: Retrieve all predictions with optional filtering
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: league
 *         schema:
 *           type: string
 *         description: Filter predictions by league
 *       - in: query
 *         name: model_version
 *         schema:
 *           type: string
 *         description: Filter by model version
 *       - in: query
 *         name: is_high_confidence
 *         schema:
 *           type: boolean
 *         description: Filter by high confidence predictions only
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of predictions to retrieve
 *     responses:
 *       200:
 *         description: List of predictions
 */
router.get('/', predictionController.getAllPredictions);

/**
 * @swagger
 * /api/predictions/analytics:
 *   get:
 *     summary: Get prediction analytics
 *     description: Retrieve analytics and statistics about predictions
 *     tags: [Predictions]
 *     responses:
 *       200:
 *         description: Prediction analytics data
 */
router.get('/analytics', predictionController.getPredictionAnalytics);

/**
 * @swagger
 * /api/predictions/ml/generate:
 *   post:
 *     summary: Generate advanced ML prediction
 *     description: Generate prediction using ensemble ML models (XGBoost, Random Forest, Neural Networks)
 *     tags: [Predictions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - homeTeamId
 *               - awayTeamId
 *             properties:
 *               homeTeamId:
 *                 type: integer
 *                 description: ID of the home team
 *                 example: 1
 *               awayTeamId:
 *                 type: integer
 *                 description: ID of the away team
 *                 example: 2
 *               league:
 *                 type: string
 *                 description: League the match is played in
 *                 example: "Premier League"
 *               matchDate:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled match date and time
 *                 example: "2025-11-15T15:00:00Z"
 *               includeHistoricalAnalysis:
 *                 type: boolean
 *                 default: true
 *                 description: Include detailed historical analysis
 *     responses:
 *       200:
 *         description: Advanced ML prediction generated successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.post('/ml/generate', validatePredictionRequest, predictionController.generateAdvancedMLPrediction);

/**
 * @swagger
 * /api/predictions/ml/batch:
 *   post:
 *     summary: Generate batch predictions
 *     description: Generate predictions for multiple matches simultaneously
 *     tags: [Predictions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matches
 *             properties:
 *               matches:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   type: object
 *                   required:
 *                     - homeTeamId
 *                     - awayTeamId
 *                   properties:
 *                     homeTeamId:
 *                       type: integer
 *                     awayTeamId:
 *                       type: integer
 *                     league:
 *                       type: string
 *                     matchDate:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Batch predictions generated successfully
 *       400:
 *         description: Invalid request (too many matches or invalid data)
 */
router.post('/ml/batch', validateBatchPredictionRequest, predictionController.generateBatchPredictions);

/**
 * @swagger
 * /api/predictions/ml/history:
 *   get:
 *     summary: Get prediction history
 *     description: Retrieve prediction history with accuracy tracking
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of predictions to retrieve
 *     responses:
 *       200:
 *         description: Prediction history retrieved successfully
 */
router.get('/ml/history', predictionController.getPredictionHistory);

/**
 * @swagger
 * /api/predictions/ml/accuracy:
 *   get:
 *     summary: Get prediction accuracy statistics
 *     description: Retrieve detailed accuracy statistics and model performance
 *     tags: [Predictions]
 *     responses:
 *       200:
 *         description: Accuracy statistics retrieved successfully
 */
router.get('/ml/accuracy', predictionController.getAccuracyStats);

export default router;