import { setupDb, cleanupDb } from './setup';
import request from 'supertest';
import app from '../src/index';

// Test data setup
const mockTeam = {
  name: 'Test Team',
  full_name: 'Test Team Full Name',
  league: 'Premier League',
  country: 'England'
};

const mockMatch = {
  home_team_id: 1,
  away_team_id: 2,
  league: 'Premier League',
  match_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  venue: 'Test Stadium',
  season: '2024-2025'
};

describe('Soccer Prediction API', () => {
  beforeAll(async () => {
    await setupDb();
  });

  afterAll(async () => {
    await cleanupDb();
  });

  describe('Health Check', () => {
    test('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('memory');
    });
  });

  describe('Teams API', () => {
    test('GET /api/teams should return list of teams', async () => {
      const response = await request(app)
        .get('/api/teams')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('POST /api/teams should create a new team', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send(mockTeam)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', mockTeam.name);
      expect(response.body.data).toHaveProperty('league', mockTeam.league);
    });

    test('POST /api/teams should validate required fields', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({}) // Empty object
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('statusCode', 400);
    });
  });

  describe('Matches API', () => {
    test('GET /api/matches should return list of matches', async () => {
      const response = await request(app)
        .get('/api/matches')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/matches/upcoming should return upcoming matches', async () => {
      const response = await request(app)
        .get('/api/matches/upcoming')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('summary');
    });

    test('POST /api/matches should create a new match', async () => {
      const response = await request(app)
        .post('/api/matches')
        .send(mockMatch)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('home_team_id', mockMatch.home_team_id);
      expect(response.body.data).toHaveProperty('away_team_id', mockMatch.away_team_id);
    });
  });

  describe('Predictions API', () => {
    test('POST /api/predictions/generate should generate a prediction', async () => {
      const predictionRequest = {
        home_team_id: 1,
        away_team_id: 2,
        match_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        league: 'Premier League'
      };

      const response = await request(app)
        .post('/api/predictions/generate')
        .send(predictionRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('predicted_outcome');
      expect(response.body.data).toHaveProperty('confidence_score');
      expect(response.body.data).toHaveProperty('predicted_probabilities');
    });

    test('GET /api/predictions/analytics should return analytics data', async () => {
      const response = await request(app)
        .get('/api/predictions/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('overall_performance');
      expect(response.body.data).toHaveProperty('model_performance');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/teams/:id with invalid ID should return 400', async () => {
      const response = await request(app)
        .get('/api/teams/abc') // Invalid ID
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('statusCode', 400);
    });

    test('GET /api/teams/:id with non-existent ID should return 404', async () => {
      const response = await request(app)
        .get('/api/teams/999999') // Non-existent ID
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('statusCode', 404);
    });

    test('GET /api/teams/:id should return 404 for teams endpoint', async () => {
      const response = await request(app)
        .get('/api/teams/999999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('statusCode', 404);
    });

    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('API Documentation', () => {
    test('GET /api-docs should return Swagger UI', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);

      expect(response.text).toContain('Soccer Prediction API');
    });
  });
});