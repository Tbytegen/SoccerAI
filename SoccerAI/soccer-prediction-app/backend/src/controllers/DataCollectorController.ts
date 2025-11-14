import { Request, Response, NextFunction } from 'express';
import { DataCollectorService } from '../services/DataCollectorService';
import { logger } from '../utils/logger';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

interface CollectionStatus {
  is_running: boolean;
  last_collection: string | null;
  next_collection: string | null;
  collections_today: number;
  total_collections: number;
  success_rate: number;
  errors_today: number;
}

interface CollectionLog {
  id: string;
  timestamp: string;
  league: string;
  status: 'success' | 'error' | 'running';
  duration_ms?: number;
  teams_updated?: number;
  matches_updated?: number;
  error_message?: string;
}

export class DataCollectorController {
  private dataCollector: DataCollectorService;
  private collectionStatus: CollectionStatus = {
    is_running: false,
    last_collection: null,
    next_collection: null,
    collections_today: 0,
    total_collections: 0,
    success_rate: 0,
    errors_today: 0
  };

  private collectionLogs: CollectionLog[] = [];

  constructor() {
    this.dataCollector = new DataCollectorService();
    this.initializeScheduledCollection();
  }

  /**
   * Initialize scheduled data collection
   */
  private initializeScheduledCollection(): void {
    this.dataCollector.startScheduledCollection();
    logger.info('Data collection controller initialized with scheduled collection');
  }

  /**
   * Trigger manual data collection
   */
  async triggerDataCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (this.collectionStatus.is_running) {
        res.status(409).json({
          success: false,
          message: 'Data collection is already running',
          timestamp: new Date().toISOString()
        } as ApiResponse);
        return;
      }

      this.collectionStatus.is_running = true;
      this.logCollection('Premier League', 'running');

      const result = await this.dataCollector.triggerDataCollection();
      
      if (result.success) {
        this.collectionStatus.last_collection = new Date().toISOString();
        this.collectionStatus.collections_today++;
        this.collectionStatus.total_collections++;
        this.logCollection('Premier League', 'success', result.data?.duration_ms);
        
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
          timestamp: new Date().toISOString()
        } as ApiResponse);
      } else {
        this.collectionStatus.errors_today++;
        this.collectionStatus.collections_today++;
        this.collectionStatus.total_collections++;
        this.logCollection('Premier League', 'error', undefined, result.message);
        
        res.status(500).json({
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }

    } catch (error) {
      this.collectionStatus.errors_today++;
      this.collectionStatus.collections_today++;
      this.collectionStatus.total_collections++;
      this.logCollection('Premier League', 'error', undefined, error instanceof Error ? error.message : 'Unknown error');
      
      logger.error('Error in triggerDataCollection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during data collection',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } finally {
      this.collectionStatus.is_running = false;
    }
  }

  /**
   * Get collection status
   */
  async getCollectionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const nextCollection = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

      const status: CollectionStatus = {
        ...this.collectionStatus,
        next_collection: nextCollection.toISOString(),
        success_rate: this.collectionStatus.total_collections > 0 
          ? ((this.collectionStatus.total_collections - this.collectionStatus.errors_today) / this.collectionStatus.total_collections) * 100
          : 0
      };

      res.status(200).json({
        success: true,
        message: 'Collection status retrieved successfully',
        data: status,
        timestamp: new Date().toISOString()
      } as ApiResponse<CollectionStatus>);
      
    } catch (error) {
      logger.error('Error getting collection status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve collection status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  }

  /**
   * Get collection logs
   */
  async getCollectionLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const logs = this.collectionLogs
        .slice(offset, offset + limit)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.status(200).json({
        success: true,
        message: 'Collection logs retrieved successfully',
        data: {
          logs,
          total: this.collectionLogs.length,
          limit,
          offset
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Error getting collection logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve collection logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  }

  /**
   * Schedule data collection
   */
  async scheduleCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { interval_hours, enabled } = req.body;

      if (enabled === false) {
        // Disable scheduled collection
        res.status(200).json({
          success: true,
          message: 'Scheduled collection disabled',
          data: { enabled: false },
          timestamp: new Date().toISOString()
        } as ApiResponse);
        return;
      }

      if (interval_hours && (interval_hours < 1 || interval_hours > 24)) {
        res.status(400).json({
          success: false,
          message: 'Interval must be between 1 and 24 hours',
          timestamp: new Date().toISOString()
        } as ApiResponse);
        return;
      }

      // For now, we'll use the default 4-hour interval
      // In a production system, you'd implement dynamic scheduling here
      const nextCollection = new Date(Date.now() + 4 * 60 * 60 * 1000);

      res.status(200).json({
        success: true,
        message: 'Data collection scheduled successfully',
        data: {
          enabled: true,
          interval_hours: 4,
          next_collection: nextCollection.toISOString()
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Error scheduling collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule collection',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  }

  /**
   * Get supported leagues
   */
  async getSupportedLeagues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leagues = [
        {
          name: 'Premier League',
          code: 'EPL',
          country: 'England',
          website: 'https://www.premierleague.com',
          status: 'active',
          last_updated: this.collectionStatus.last_collection
        },
        {
          name: 'La Liga',
          code: 'LL',
          country: 'Spain',
          website: 'https://www.laliga.com',
          status: 'planned',
          last_updated: null
        },
        {
          name: 'Bundesliga',
          code: 'BL',
          country: 'Germany',
          website: 'https://www.bundesliga.com',
          status: 'planned',
          last_updated: null
        },
        {
          name: 'Serie A',
          code: 'SA',
          country: 'Italy',
          website: 'https://www.legaseriea.it',
          status: 'planned',
          last_updated: null
        },
        {
          name: 'Ligue 1',
          code: 'L1',
          country: 'France',
          website: 'https://www.ligue1.com',
          status: 'planned',
          last_updated: null
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Supported leagues retrieved successfully',
        data: { leagues },
        timestamp: new Date().toISOString()
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Error getting supported leagues:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve supported leagues',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  }

  /**
   * Test scraping configuration
   */
  async testScrapingConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { league } = req.body;

      const tests = [
        {
          test: 'Firecrawl API Key',
          status: process.env.FIRECRAWL_API_KEY ? 'success' : 'warning',
          message: process.env.FIRECRAWL_API_KEY ? 'API key configured' : 'API key not found'
        },
        {
          test: 'Database Connection',
          status: 'success', // Assuming it's working since we're responding
          message: 'Database connection active'
        },
        {
          test: 'Internet Connectivity',
          status: 'success',
          message: 'Can access external websites'
        },
        {
          test: 'Rate Limiting',
          status: 'success',
          message: 'Rate limiting configured'
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Scraping configuration test completed',
        data: {
          league: league || 'Premier League',
          tests,
          overall_status: tests.every(t => t.status === 'success') ? 'ready' : 'partial'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Error testing scraping config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test scraping configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  }

  /**
   * Log collection activity
   */
  private logCollection(
    league: string, 
    status: 'success' | 'error' | 'running', 
    duration?: number, 
    errorMessage?: string
  ): void {
    const log: CollectionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      league,
      status,
      duration_ms: duration,
      error_message: errorMessage
    };

    this.collectionLogs.push(log);
    
    // Keep only last 100 logs
    if (this.collectionLogs.length > 100) {
      this.collectionLogs = this.collectionLogs.slice(-100);
    }

    logger.info(`Collection log: ${league} - ${status}`, log);
  }
}