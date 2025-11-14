import { Router } from 'express';
import { MatchController } from '../controllers/MatchController';

const router = Router();
const matchController = new MatchController();

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Get all matches
 *     description: Retrieve all matches with optional filtering and pagination
 *     tags: [Matches]
 *     parameters:
 *       - in: query
 *         name: league
 *         schema:
 *           type: string
 *         description: Filter matches by league
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, completed, cancelled, postponed]
 *         description: Filter matches by status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter matches from date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter matches to date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of matches per page
 *     responses:
 *       200:
 *         description: List of matches
 */
router.get('/', matchController.getAllMatches);

/**
 * @swagger
 * /api/matches/{id}:
 *   get:
 *     summary: Get match by ID
 *     description: Retrieve a specific match by its ID
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match found
 *       404:
 *         description: Match not found
 */
router.get('/:id', matchController.getMatchById);

/**
 * @swagger
 * /api/matches/upcoming:
 *   get:
 *     summary: Get upcoming matches
 *     description: Retrieve upcoming matches within a specified date range
 *     tags: [Matches]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days ahead to look for matches
 *       - in: query
 *         name: league
 *         schema:
 *           type: string
 *         description: Filter by specific league
 *     responses:
 *       200:
 *         description: List of upcoming matches
 */
router.get('/upcoming', matchController.getUpcomingMatches);

/**
 * @swagger
 * /api/matches/completed:
 *   get:
 *     summary: Get completed matches
 *     description: Retrieve completed matches
 *     tags: [Matches]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recent matches to retrieve
 *       - in: query
 *         name: league
 *         schema:
 *           type: string
 *         description: Filter by specific league
 *     responses:
 *       200:
 *         description: List of completed matches
 */
router.get('/completed', matchController.getCompletedMatches);

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Create a new match
 *     description: Add a new match to the database
 *     tags: [Matches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - home_team_id
 *               - away_team_id
 *               - league
 *               - match_date
 *             properties:
 *               home_team_id:
 *                 type: integer
 *                 description: ID of the home team
 *                 example: 1
 *               away_team_id:
 *                 type: integer
 *                 description: ID of the away team
 *                 example: 2
 *               league:
 *                 type: string
 *                 description: League the match is played in
 *                 example: "Premier League"
 *               match_date:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled match date and time
 *                 example: "2025-11-15T15:00:00Z"
 *               venue:
 *                 type: string
 *                 description: Match venue/stadium
 *                 example: "Old Trafford"
 *               season:
 *                 type: string
 *                 description: Season identifier
 *                 example: "2024-2025"
 *     responses:
 *       201:
 *         description: Match created successfully
 */
router.post('/', matchController.createMatch);

/**
 * @swagger
 * /api/matches/{id}/result:
 *   patch:
 *     summary: Update match result
 *     description: Update the result of a completed match
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - home_score
 *               - away_score
 *             properties:
 *               home_score:
 *                 type: integer
 *                 description: Home team score
 *                 example: 2
 *               away_score:
 *                 type: integer
 *                 description: Away team score
 *                 example: 1
 *               status:
 *                 type: string
 *                 enum: [completed]
 *                 default: completed
 *               attendance:
 *                 type: integer
 *                 description: Match attendance
 *                 example: 75000
 *               home_goals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     minute:
 *                       type: integer
 *                     player:
 *                       type: string
 *               away_goals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     minute:
 *                       type: integer
 *                     player:
 *                       type: string
 *     responses:
 *       200:
 *         description: Match result updated successfully
 */
router.patch('/:id/result', matchController.updateMatchResult);

export default router;