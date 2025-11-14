import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool;

// Setup database connection for tests
export const setupDb = async () => {
  try {
    // Use test database if available, otherwise use a clean database setup
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://soccer_user:soccer_password@localhost:5432/soccer_predictions_test';
    
    pool = new Pool({
      connectionString: databaseUrl,
    });

    // Test the connection
    await pool.query('SELECT 1');
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
};

// Cleanup database connection after tests
export const cleanupDb = async () => {
  try {
    if (pool) {
      await pool.end();
      console.log('Test database connection closed');
    }
  } catch (error) {
    console.error('Error closing test database connection:', error);
  }
};

// Helper function to get test database client
export const getTestDbClient = async () => {
  if (!pool) {
    await setupDb();
  }
  return await pool.connect();
};

// Helper function to clean specific tables
export const cleanTable = async (tableName: string) => {
  if (!pool) return;
  
  try {
    await pool.query(`DELETE FROM ${tableName}`);
  } catch (error) {
    console.error(`Error cleaning table ${tableName}:`, error);
  }
};

// Helper function to reset all tables
export const resetAllTables = async () => {
  if (!pool) return;
  
  const tables = [
    'prediction_analytics',
    'scraping_jobs',
    'data_sources',
    'league_tables',
    'head_to_head_records',
    'team_form_history',
    'predictions',
    'matches',
    'teams',
    'users'
  ];
  
  for (const table of tables) {
    await cleanTable(table);
  }
};