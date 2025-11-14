import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation schemas
export const teamCreationSchema = Joi.object({
  name: Joi.string().min(1).max(255).required()
    .messages({
      'string.empty': 'Team name cannot be empty',
      'string.max': 'Team name cannot exceed 255 characters'
    }),
  full_name: Joi.string().max(255).optional()
    .messages({
      'string.max': 'Full team name cannot exceed 255 characters'
    }),
  league: Joi.string().valid('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1').required()
    .messages({
      'any.only': 'League must be one of: Premier League, La Liga, Serie A, Bundesliga, Ligue 1',
      'any.required': 'League is required'
    }),
  country: Joi.string().max(100).optional(),
  logo_url: Joi.string().uri().optional()
    .messages({
      'string.uri': 'Logo URL must be a valid URL'
    }),
  website_url: Joi.string().uri().optional()
    .messages({
      'string.uri': 'Website URL must be a valid URL'
    }),
  stadium: Joi.string().max(255).optional(),
  founded: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional()
    .messages({
      'number.min': 'Founded year must be after 1800',
      'number.max': `Founded year cannot be after ${new Date().getFullYear()}`
    })
});

export const teamUpdateSchema = teamCreationSchema.keys({
  name: Joi.string().min(1).max(255).optional(),
  league: Joi.string().valid('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1').optional(),
  position: Joi.number().integer().min(1).max(20).optional()
    .messages({
      'number.min': 'Position must be at least 1',
      'number.max': 'Position cannot exceed 20'
    }),
  points: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Points cannot be negative'
    }),
  played_games: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Played games cannot be negative'
    }),
  wins: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Wins cannot be negative'
    }),
  draws: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Draws cannot be negative'
    }),
  losses: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Losses cannot be negative'
    }),
  goals_for: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Goals for cannot be negative'
    }),
  goals_against: Joi.number().integer().min(0).optional()
    .messages({
      'number.min': 'Goals against cannot be negative'
    }),
  form: Joi.string().pattern(/^[WDL]{1,10}$/).optional()
    .messages({
      'string.pattern.base': 'Form must contain only W (win), D (draw), and L (loss) characters'
    })
});

export const teamIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.positive': 'Team ID must be a positive number',
      'number.base': 'Team ID must be a number'
    })
});

export const teamQuerySchema = Joi.object({
  league: Joi.string().valid('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1').optional(),
  country: Joi.string().max(100).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
  sortBy: Joi.string().valid('name', 'league', 'position', 'points', 'goals_for', 'goals_against').default('name').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc').optional(),
  search: Joi.string().max(255).optional()
});

// Validation middleware functions
export const validateTeamCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = teamCreationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        validationErrors: errorMessages
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.body = value;
  next();
};

export const validateTeamUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = teamUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        validationErrors: errorMessages
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.body = value;
  next();
};

export const validateTeamId = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = teamIdSchema.validate(req.params, {
    abortEarly: false
  });

  if (error) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid team ID',
        statusCode: 400,
        validationErrors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.params = value;
  next();
};

export const validateTeamQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = teamQuerySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid query parameters',
        statusCode: 400,
        validationErrors: errorMessages
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.query = value;
  next();
};

// Data Collection validation schemas
export const dataCollectionRequestSchema = Joi.object({
  league: Joi.string().valid('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1').optional()
    .messages({
      'any.only': 'League must be one of: Premier League, La Liga, Serie A, Bundesliga, Ligue 1'
    }),
  force: Joi.boolean().default(false).optional()
    .messages({
      'boolean.base': 'Force parameter must be a boolean'
    })
});

export const scheduleCollectionSchema = Joi.object({
  interval_hours: Joi.number().integer().min(1).max(24).optional()
    .messages({
      'number.min': 'Interval must be at least 1 hour',
      'number.max': 'Interval cannot exceed 24 hours'
    }),
  enabled: Joi.boolean().required()
    .messages({
      'boolean.base': 'Enabled parameter must be a boolean',
      'any.required': 'Enabled parameter is required'
    })
});

export const testScrapingSchema = Joi.object({
  league: Joi.string().valid('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1').optional()
    .messages({
      'any.only': 'League must be one of: Premier League, La Liga, Serie A, Bundesliga, Ligue 1'
    })
});

export const validateDataCollectionRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = dataCollectionRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed for data collection request',
        statusCode: 400,
        validationErrors: errorMessages
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.body = value;
  next();
};

export const validateScheduleCollection = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = scheduleCollectionSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed for schedule collection request',
        statusCode: 400,
        validationErrors: errorMessages
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.body = value;
  next();
};

// ML Prediction validation schemas
export const predictionRequestSchema = Joi.object({
  homeTeamId: Joi.number().integer().positive().required()
    .messages({
      'number.positive': 'Home team ID must be a positive number',
      'number.base': 'Home team ID must be a number',
      'any.required': 'Home team ID is required'
    }),
  awayTeamId: Joi.number().integer().positive().required()
    .messages({
      'number.positive': 'Away team ID must be a positive number',
      'number.base': 'Away team ID must be a number',
      'any.required': 'Away team ID is required'
    }),
  league: Joi.string().valid('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1').optional()
    .messages({
      'any.only': 'League must be one of: Premier League, La Liga, Serie A, Bundesliga, Ligue 1'
    }),
  matchDate: Joi.date().iso().optional()
    .messages({
      'date.format': 'Match date must be in ISO format'
    }),
  includeHistoricalAnalysis: Joi.boolean().default(true).optional()
    .messages({
      'boolean.base': 'includeHistoricalAnalysis must be a boolean'
    })
});

export const batchPredictionSchema = Joi.object({
  matches: Joi.array().items(
    Joi.object({
      homeTeamId: Joi.number().integer().positive().required(),
      awayTeamId: Joi.number().integer().positive().required(),
      league: Joi.string().valid('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1').optional(),
      matchDate: Joi.date().iso().optional()
    })
  ).min(1).max(20).required()
    .messages({
      'array.min': 'At least one match is required',
      'array.max': 'Maximum 20 matches allowed per batch'
    })
});

export const validatePredictionRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = predictionRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed for prediction request',
        statusCode: 400,
        validationErrors: errorMessages
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Additional validation: ensure teams are different
  if (value.homeTeamId === value.awayTeamId) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Home team and away team must be different',
        statusCode: 400
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.body = value;
  next();
};

export const validateBatchPredictionRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = batchPredictionSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed for batch prediction request',
        statusCode: 400,
        validationErrors: errorMessages
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Check for duplicate teams in matches
  const teamPairs = new Set();
  for (const match of value.matches) {
    const pair = `${match.homeTeamId}-${match.awayTeamId}`;
    if (teamPairs.has(pair)) {
      res.status(400).json({
        success: false,
        error: {
          message: `Duplicate match detected: Team ${match.homeTeamId} vs Team ${match.awayTeamId}`,
          statusCode: 400
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    teamPairs.add(pair);
  }

  req.body = value;
  next();
};