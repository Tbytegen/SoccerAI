import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Soccer Prediction API',
      version: '1.0.0',
      description: 'API for soccer match predictions using machine learning',
      contact: {
        name: 'API Support',
        email: 'support@soccer-predictions.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-api-domain.com' 
          : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      schemas: {
        Team: {
          type: 'object',
          required: ['name', 'league'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the team'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'UUID for the team'
            },
            name: {
              type: 'string',
              description: 'Short name of the team'
            },
            full_name: {
              type: 'string',
              description: 'Full official name of the team'
            },
            league: {
              type: 'string',
              description: 'League the team plays in',
              enum: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1']
            },
            country: {
              type: 'string',
              description: 'Country of the team'
            },
            position: {
              type: 'integer',
              description: 'Current league position',
              minimum: 1,
              maximum: 20
            },
            points: {
              type: 'integer',
              description: 'Total points in current season',
              minimum: 0
            },
            played_games: {
              type: 'integer',
              description: 'Number of games played',
              minimum: 0
            },
            wins: {
              type: 'integer',
              description: 'Number of wins',
              minimum: 0
            },
            draws: {
              type: 'integer',
              description: 'Number of draws',
              minimum: 0
            },
            losses: {
              type: 'integer',
              description: 'Number of losses',
              minimum: 0
            },
            goals_for: {
              type: 'integer',
              description: 'Goals scored',
              minimum: 0
            },
            goals_against: {
              type: 'integer',
              description: 'Goals conceded',
              minimum: 0
            },
            goal_difference: {
              type: 'integer',
              description: 'Goal difference (goals_for - goals_against)'
            },
            form: {
              type: 'string',
              description: 'Recent form (e.g., "WWDLL")',
              pattern: '^[WDL]{1,10}$'
            },
            logo_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to team logo'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Match: {
          type: 'object',
          required: ['home_team_id', 'away_team_id', 'league', 'match_date'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the match'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'UUID for the match'
            },
            home_team_id: {
              type: 'integer',
              description: 'ID of the home team'
            },
            away_team_id: {
              type: 'integer',
              description: 'ID of the away team'
            },
            league: {
              type: 'string',
              description: 'League the match is played in'
            },
            match_date: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled match date and time'
            },
            venue: {
              type: 'string',
              description: 'Match venue/stadium'
            },
            status: {
              type: 'string',
              description: 'Match status',
              enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
              default: 'scheduled'
            },
            home_score: {
              type: 'integer',
              description: 'Home team score (for completed matches)'
            },
            away_score: {
              type: 'integer',
              description: 'Away team score (for completed matches)'
            },
            season: {
              type: 'string',
              description: 'Season identifier (e.g., "2024-2025")'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Prediction: {
          type: 'object',
          required: ['match_id', 'predicted_outcome', 'confidence_score', 'model_version'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the prediction'
            },
            uuid: {
              type: 'string',
              format: 'uuid',
              description: 'UUID for the prediction'
            },
            match_id: {
              type: 'integer',
              description: 'ID of the match being predicted'
            },
            predicted_outcome: {
              type: 'string',
              description: 'Predicted outcome',
              enum: ['home_win', 'draw', 'away_win']
            },
            predicted_probabilities: {
              type: 'object',
              properties: {
                home_win: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description: 'Probability of home team winning'
                },
                draw: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description: 'Probability of draw'
                },
                away_win: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description: 'Probability of away team winning'
                }
              }
            },
            confidence_score: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Overall confidence score (0.0 to 1.0)'
            },
            model_version: {
              type: 'string',
              description: 'Version of the ML model used for prediction'
            },
            model_name: {
              type: 'string',
              description: 'Name of the ML model used'
            },
            is_high_confidence: {
              type: 'boolean',
              description: 'Whether this is a high confidence prediction'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                statusCode: {
                  type: 'integer',
                  description: 'HTTP status code'
                }
              }
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        DataCollectionStatus: {
          type: 'object',
          properties: {
            is_running: {
              type: 'boolean',
              description: 'Whether data collection is currently running'
            },
            last_collection: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of last collection'
            },
            next_collection: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of next scheduled collection'
            },
            collections_today: {
              type: 'integer',
              description: 'Number of collections today'
            },
            total_collections: {
              type: 'integer',
              description: 'Total number of collections'
            },
            success_rate: {
              type: 'number',
              description: 'Success rate percentage'
            },
            errors_today: {
              type: 'integer',
              description: 'Number of errors today'
            }
          }
        },
        CollectionLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the log entry'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Log timestamp'
            },
            league: {
              type: 'string',
              description: 'League being collected'
            },
            status: {
              type: 'string',
              enum: ['success', 'error', 'running'],
              description: 'Collection status'
            },
            duration_ms: {
              type: 'integer',
              description: 'Collection duration in milliseconds'
            },
            teams_updated: {
              type: 'integer',
              description: 'Number of teams updated'
            },
            matches_updated: {
              type: 'integer',
              description: 'Number of matches updated'
            },
            error_message: {
              type: 'string',
              description: 'Error message if collection failed'
            }
          }
        },
        League: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'League name'
            },
            code: {
              type: 'string',
              description: 'League code'
            },
            country: {
              type: 'string',
              description: 'League country'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Official league website'
            },
            status: {
              type: 'string',
              enum: ['active', 'planned'],
              description: 'Collection status for this league'
            },
            last_updated: {
              type: 'string',
              format: 'date-time',
              description: 'Last time data was collected for this league'
            }
          }
        },
        ScrapingTest: {
          type: 'object',
          properties: {
            test: {
              type: 'string',
              description: 'Name of the test'
            },
            status: {
              type: 'string',
              enum: ['success', 'warning', 'error'],
              description: 'Test result status'
            },
            message: {
              type: 'string',
              description: 'Test result message'
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse'
            }
          }
        }
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError'
            }
          }
        }
      },
      404: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError'
            }
          }
        }
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export default swaggerJsdoc(options);