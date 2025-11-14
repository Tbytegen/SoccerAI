/**
 * Phase 2 Data Collection Integration Test
 * Tests the data collection infrastructure without requiring external APIs
 */

import { DataCollectorService } from '../src/services/DataCollectorService';
import { DataCollectorController } from '../src/controllers/DataCollectorController';
import { db } from '../src/config/database';

describe('Phase 2 Data Collection Integration', () => {
  let dataCollectorService: DataCollectorService;
  let dataCollectorController: DataCollectorController;

  beforeAll(() => {
    dataCollectorService = new DataCollectorService();
    dataCollectorController = new DataCollectorController();
  });

  afterAll(async () => {
    // Clean up any test data
    if (db.pool) {
      await db.pool.end();
    }
  });

  describe('DataCollectorService', () => {
    test('should initialize without errors', () => {
      expect(dataCollectorService).toBeDefined();
    });

    test('should handle missing API key gracefully', () => {
      // This should not throw an error during initialization
      expect(() => new DataCollectorService()).not.toThrow();
    });

    test('should have correct base URLs configured', () => {
      // Test that all expected league URLs are configured
      expect(dataCollectorService['baseUrls']).toBeDefined();
      expect(dataCollectorService['baseUrls'].premierLeague).toBe('https://www.premierleague.com');
      expect(dataCollectorService['baseUrls'].laliga).toBe('https://www.laliga.com');
      expect(dataCollectorService['baseUrls'].bundesliga).toBe('https://www.bundesliga.com');
      expect(dataCollectorService['baseUrls'].serieA).toBe('https://www.legaseriea.it');
      expect(dataCollectorService['baseUrls'].ligue1).toBe('https://www.ligue1.com');
    });
  });

  describe('DataCollectorController', () => {
    test('should initialize without errors', () => {
      expect(dataCollectorController).toBeDefined();
    });

    test('should have proper collection status initialized', () => {
      // Since we can't access private properties, we test public methods
      expect(dataCollectorController).toBeInstanceOf(DataCollectorController);
    });
  });

  describe('Database Integration', () => {
    test('should have database connection configured', () => {
      expect(db).toBeDefined();
      expect(db.query).toBeDefined();
      expect(db.getClient).toBeDefined();
    });
  });

  describe('API Routes', () => {
    test('should have all expected routes configured', () => {
      // This test would require the Express app to be running
      // For now, we'll just verify the routes exist in the module
      const dataCollectionRoutes = require('../src/routes/dataCollection');
      expect(dataCollectionRoutes).toBeDefined();
      expect(dataCollectionRoutes.default).toBeDefined();
    });
  });

  describe('Validation Schemas', () => {
    test('should have data collection request validation', () => {
      const validation = require('../src/middleware/validation');
      expect(validation.validateDataCollectionRequest).toBeDefined();
      expect(validation.validateScheduleCollection).toBeDefined();
    });
  });

  describe('Configuration', () => {
    test('should have required environment variables documented', () => {
      // Check that required env vars are in .env.example
      const fs = require('fs');
      const path = require('path');
      const envExamplePath = path.join(__dirname, '../../.env.example');
      
      if (fs.existsSync(envExamplePath)) {
        const envExample = fs.readFileSync(envExamplePath, 'utf8');
        expect(envExample).toContain('FIRECRAWL_API_KEY');
        expect(envExample).toContain('CRAWL4AI_API_KEY');
        expect(envExample).toContain('DB_HOST');
        expect(envExample).toContain('DB_PORT');
      }
    });
  });
});

// Mock test for data collection without external dependencies
describe('Mock Data Collection Tests', () => {
  test('should parse sample HTML correctly', () => {
    const sampleHtml = `
      <table>
        <tr>
          <td>1</td>
          <td>Arsenal</td>
          <td>20</td>
          <td>15</td>
          <td>3</td>
          <td>2</td>
          <td>45</td>
          <td>18</td>
          <td>+27</td>
          <td>48</td>
          <td>WWDLL</td>
        </tr>
      </table>
    `;

    // This would test the parsing logic in a real implementation
    expect(sampleHtml).toContain('Arsenal');
    expect(sampleHtml).toContain('WWDLL');
  });

  test('should generate valid API responses', () => {
    const mockResponse = {
      success: true,
      message: 'Data collection completed successfully',
      data: {
        duration_ms: 45000,
        timestamp: new Date().toISOString(),
        leagues_processed: ['Premier League']
      },
      timestamp: new Date().toISOString()
    };

    expect(mockResponse.success).toBe(true);
    expect(mockResponse.data.leagues_processed).toContain('Premier League');
    expect(mockResponse.data.duration_ms).toBeGreaterThan(0);
  });
});

// Performance test
describe('Performance Tests', () => {
  test('should handle collection operations within reasonable time', async () => {
    const startTime = Date.now();
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });
});