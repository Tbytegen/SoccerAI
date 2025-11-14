import { Router } from 'express';
import { TeamController } from '../controllers/TeamController';
import { validateTeamCreation, validateTeamUpdate, validateTeamId } from '../middleware/validation';

const router = Router();
const teamController = new TeamController();

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams
 *     description: Retrieve all teams with optional filtering and pagination
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: league
 *         schema:
 *           type: string
 *           enum: [Premier League, La Liga, Serie A, Bundesliga, Ligue 1]
 *         description: Filter teams by league
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter teams by country
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
 *         description: Number of teams per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, league, position, points]
 *           default: name
 *         description: Sort teams by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', teamController.getAllTeams);

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     description: Retrieve a specific team by its ID
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Team not found
 */
router.get('/:id', validateTeamId, teamController.getTeamById);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create a new team
 *     description: Add a new team to the database
 *     tags: [Teams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - league
 *             properties:
 *               name:
 *                 type: string
 *                 description: Short name of the team
 *                 example: "Manchester United"
 *               full_name:
 *                 type: string
 *                 description: Full official name of the team
 *                 example: "Manchester United Football Club"
 *               league:
 *                 type: string
 *                 enum: [Premier League, La Liga, Serie A, Bundesliga, Ligue 1]
 *                 description: League the team plays in
 *                 example: "Premier League"
 *               country:
 *                 type: string
 *                 description: Country of the team
 *                 example: "England"
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 description: URL to team logo
 *                 example: "https://example.com/logo.png"
 *               website_url:
 *                 type: string
 *                 format: uri
 *                 description: Team website URL
 *                 example: "https://www.manutd.com"
 *               stadium:
 *                 type: string
 *                 description: Home stadium name
 *                 example: "Old Trafford"
 *               founded:
 *                 type: integer
 *                 description: Year the team was founded
 *                 example: 1878
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *                   example: "Team created successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input data
 */
router.post('/', validateTeamCreation, teamController.createTeam);

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: Update a team
 *     description: Update an existing team's information
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Short name of the team
 *               full_name:
 *                 type: string
 *                 description: Full official name of the team
 *               league:
 *                 type: string
 *                 enum: [Premier League, La Liga, Serie A, Bundesliga, Ligue 1]
 *               country:
 *                 type: string
 *               position:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *               points:
 *                 type: integer
 *                 minimum: 0
 *               logo_url:
 *                 type: string
 *                 format: uri
 *               website_url:
 *                 type: string
 *                 format: uri
 *               stadium:
 *                 type: string
 *     responses:
 *       200:
 *         description: Team updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Team not found
 */
router.put('/:id', validateTeamId, validateTeamUpdate, teamController.updateTeam);

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Delete a team
 *     description: Delete a team from the database
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *       404:
 *         description: Team not found
 */
router.delete('/:id', validateTeamId, teamController.deleteTeam);

/**
 * @swagger
 * /api/teams/{id}/stats:
 *   get:
 *     summary: Get team statistics
 *     description: Retrieve detailed statistics for a specific team
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team statistics retrieved successfully
 */
router.get('/:id/stats', validateTeamId, teamController.getTeamStats);

/**
 * @swagger
 * /api/teams/{id}/form:
 *   get:
 *     summary: Get team form history
 *     description: Retrieve recent form history for a specific team
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent matches to include
 *     responses:
 *       200:
 *         description: Team form retrieved successfully
 */
router.get('/:id/form', validateTeamId, teamController.getTeamForm);

export default router;