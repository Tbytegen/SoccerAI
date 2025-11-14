/**
 * @swagger
 * tags:
 *   - name: Data Collection
 *     description: Data collection and scraping endpoints
 */

import express from 'express';
import { DataCollectorController } from '../controllers/DataCollectorController';
import { validateDataCollectionRequest } from '../middleware/validation';

const router = express.Router();
const dataCollectorController = new DataCollectorController();

/**
 * @swagger
 * /api/data-collection/collect:
 *   post:
 *     summary: Trigger manual data collection
 *     description: Manually trigger data collection for soccer leagues
 *     tags: [Data Collection]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               league:
 *                 type: string
 *                 enum: [Premier League, La Liga, Serie A, Bundesliga, Ligue 1]
 *                 description: Specific league to collect data for
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Force collection even if already running
 *     responses:
 *       200:
 *         description: Data collection triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       409:
 *         description: Collection already running
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/data-collection/status:
 *   get:
 *     summary: Get data collection status
 *     description: Retrieve current status of data collection service
 *     tags: [Data Collection]
 *     responses:
 *       200:
 *         description: Collection status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DataCollectionStatus'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/data-collection/logs:
 *   get:
 *     summary: Get collection logs
 *     description: Retrieve data collection logs
 *     tags: [Data Collection]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: Collection logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CollectionLog'
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/data-collection/schedule:
 *   post:
 *     summary: Schedule data collection
 *     description: Configure automatic data collection schedule
 *     tags: [Data Collection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Enable or disable scheduled collection
 *               interval_hours:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 24
 *                 description: Collection interval in hours
 *     responses:
 *       200:
 *         description: Collection schedule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     interval_hours:
 *                       type: integer
 *                     next_collection:
 *                       type: string
 *                       format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request parameters
 */

/**
 * @swagger
 * /api/data-collection/leagues:
 *   get:
 *     summary: Get supported leagues
 *     description: Retrieve list of supported leagues for data collection
 *     tags: [Data Collection]
 *     responses:
 *       200:
 *         description: Supported leagues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     leagues:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/League'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/data-collection/test-scraping:
 *   post:
 *     summary: Test scraping configuration
 *     description: Test scraping configuration and connectivity
 *     tags: [Data Collection]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               league:
 *                 type: string
 *                 enum: [Premier League, La Liga, Serie A, Bundesliga, Ligue 1]
 *                 description: League to test scraping for
 *     responses:
 *       200:
 *         description: Scraping configuration test completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     league:
 *                       type: string
 *                     tests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ScrapingTest'
 *                     overall_status:
 *                       type: string
 *                       enum: [ready, partial, error]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

// Start data collection manually
router.post('/collect', validateDataCollectionRequest, async (req, res, next) => {
  await dataCollectorController.triggerDataCollection(req, res, next);
});

// Get collection status
router.get('/status', async (req, res, next) => {
  await dataCollectorController.getCollectionStatus(req, res, next);
});

// Get collection logs
router.get('/logs', async (req, res, next) => {
  await dataCollectorController.getCollectionLogs(req, res, next);
});

// Schedule data collection
router.post('/schedule', async (req, res, next) => {
  await dataCollectorController.scheduleCollection(req, res, next);
});

// Get supported leagues
router.get('/leagues', async (req, res, next) => {
  await dataCollectorController.getSupportedLeagues(req, res, next);
});

// Test scraping configuration
router.post('/test-scraping', async (req, res, next) => {
  await dataCollectorController.testScrapingConfig(req, res, next);
});

export default router;