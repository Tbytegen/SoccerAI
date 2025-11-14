import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ConflictError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Mock data store (replace with actual database in production)
let matches: any[] = [
  {
    id: 1,
    uuid: '650e8400-e29b-41d4-a716-446655440001',
    home_team_id: 1,
    away_team_id: 2,
    league: 'Premier League',
    match_date: new Date('2025-11-15T15:00:00Z'),
    venue: 'Old Trafford',
    status: 'scheduled',
    season: '2024-2025',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    uuid: '650e8400-e29b-41d4-a716-446655440002',
    home_team_id: 3,
    away_team_id: 1,
    league: 'La Liga',
    match_date: new Date('2025-11-16T20:00:00Z'),
    venue: 'Santiago Bernabéu',
    status: 'scheduled',
    season: '2024-2025',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    uuid: '650e8400-e29b-41d4-a716-446655440003',
    home_team_id: 2,
    away_team_id: 3,
    league: 'Premier League',
    match_date: new Date('2025-11-10T15:00:00Z'),
    venue: 'Anfield',
    status: 'completed',
    home_score: 2,
    away_score: 1,
    season: '2024-2025',
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Mock teams data (this would come from the teams controller/service)
const mockTeams = [
  { id: 1, name: 'Manchester United', league: 'Premier League' },
  { id: 2, name: 'Liverpool', league: 'Premier League' },
  { id: 3, name: 'Real Madrid', league: 'La Liga' }
];

let nextMatchId = 4;

export class MatchController {
  /**
   * Get all matches with filtering and pagination
   */
  getAllMatches = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Getting all matches', { query: req.query });

    const {
      league,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    let filteredMatches = [...matches];

    // Apply filters
    if (league) {
      filteredMatches = filteredMatches.filter(match => match.league === league);
    }

    if (status) {
      filteredMatches = filteredMatches.filter(match => match.status === status);
    }

    if (start_date) {
      const startDate = new Date(start_date as string);
      filteredMatches = filteredMatches.filter(match => 
        new Date(match.match_date) >= startDate
      );
    }

    if (end_date) {
      const endDate = new Date(end_date as string);
      filteredMatches = filteredMatches.filter(match => 
        new Date(match.match_date) <= endDate
      );
    }

    // Sort by match date (newest first)
    filteredMatches.sort((a, b) => 
      new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    );

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedMatches = filteredMatches.slice(startIndex, endIndex);

    // Add team names to matches
    const matchesWithTeams = paginatedMatches.map(match => ({
      ...match,
      home_team: mockTeams.find(team => team.id === match.home_team_id),
      away_team: mockTeams.find(team => team.id === match.away_team_id)
    }));

    const total = filteredMatches.length;
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: matchesWithTeams,
      pagination: {
        current_page: pageNum,
        per_page: limitNum,
        total,
        total_pages: totalPages
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get match by ID
   */
  getMatchById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info('Getting match by ID', { id });

    const match = matches.find(m => m.id === parseInt(id));
    
    if (!match) {
      throw new NotFoundError(`Match with ID ${id} not found`);
    }

    // Add team information
    const matchWithTeams = {
      ...match,
      home_team: mockTeams.find(team => team.id === match.home_team_id),
      away_team: mockTeams.find(team => team.id === match.away_team_id)
    };

    res.status(200).json({
      success: true,
      data: matchWithTeams,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get upcoming matches
   */
  getUpcomingMatches = asyncHandler(async (req: Response, res: Response) => {
    logger.info('Getting upcoming matches', { query: req.query });

    const { days = 7, league } = req.query;
    const lookAheadDate = new Date();
    lookAheadDate.setDate(lookAheadDate.getDate() + Number(days));

    let upcomingMatches = matches.filter(match => 
      match.status === 'scheduled' && 
      new Date(match.match_date) <= lookAheadDate &&
      new Date(match.match_date) >= new Date()
    );

    if (league) {
      upcomingMatches = upcomingMatches.filter(match => match.league === league);
    }

    // Sort by match date
    upcomingMatches.sort((a, b) => 
      new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );

    // Add team information
    const matchesWithTeams = upcomingMatches.map(match => ({
      ...match,
      home_team: mockTeams.find(team => team.id === match.home_team_id),
      away_team: mockTeams.find(team => team.id === match.away_team_id)
    }));

    res.status(200).json({
      success: true,
      data: matchesWithTeams,
      summary: {
        total_matches: matchesWithTeams.length,
        date_range: {
          from: new Date().toISOString(),
          to: lookAheadDate.toISOString()
        },
        filtered_by_league: league || 'All leagues'
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get completed matches
   */
  getCompletedMatches = asyncHandler(async (req: Response, res: Response) => {
    logger.info('Getting completed matches', { query: req.query });

    const { limit = 20, league } = req.query;

    let completedMatches = matches.filter(match => match.status === 'completed');

    if (league) {
      completedMatches = completedMatches.filter(match => match.league === league);
    }

    // Sort by match date (most recent first)
    completedMatches.sort((a, b) => 
      new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    );

    // Apply limit
    const limitedMatches = completedMatches.slice(0, Number(limit));

    // Add team information
    const matchesWithTeams = limitedMatches.map(match => ({
      ...match,
      home_team: mockTeams.find(team => team.id === match.home_team_id),
      away_team: mockTeams.find(team => team.id === match.away_team_id),
      result: match.home_score > match.away_score ? 'Home Win' :
              match.home_score < match.away_score ? 'Away Win' : 'Draw'
    }));

    res.status(200).json({
      success: true,
      data: matchesWithTeams,
      summary: {
        total_matches: matchesWithTeams.length,
        total_goals: matchesWithTeams.reduce((total, match) => 
          total + (match.home_score || 0) + (match.away_score || 0), 0),
        average_goals_per_match: matchesWithTeams.length > 0 ? 
          matchesWithTeams.reduce((total, match) => 
            total + (match.home_score || 0) + (match.away_score || 0), 0) / matchesWithTeams.length : 0
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Create a new match
   */
  createMatch = asyncHandler(async (req: Request, res: Response) => {
    const { home_team_id, away_team_id, league, match_date, venue, season } = req.body;
    logger.info('Creating new match', { home_team_id, away_team_id, league });

    // Validate that teams exist and are in the same league
    const homeTeam = mockTeams.find(team => team.id === home_team_id);
    const awayTeam = mockTeams.find(team => team.id === away_team_id);

    if (!homeTeam) {
      throw new NotFoundError(`Home team with ID ${home_team_id} not found`);
    }

    if (!awayTeam) {
      throw new NotFoundError(`Away team with ID ${away_team_id} not found`);
    }

    if (homeTeam.league !== league || awayTeam.league !== league) {
      throw new ValidationError('Teams must belong to the specified league');
    }

    if (home_team_id === away_team_id) {
      throw new ConflictError('A team cannot play against itself');
    }

    // Check for scheduling conflicts
    const matchDateTime = new Date(match_date);
    const conflictingMatch = matches.find(match => 
      (match.home_team_id === home_team_id || match.home_team_id === away_team_id ||
       match.away_team_id === home_team_id || match.away_team_id === away_team_id) &&
      Math.abs(new Date(match.match_date).getTime() - matchDateTime.getTime()) < 7 * 24 * 60 * 60 * 1000 // Within 7 days
    );

    if (conflictingMatch) {
      throw new ConflictError(`Team has a conflicting match on ${conflictingMatch.match_date}`);
    }

    const newMatch = {
      id: nextMatchId++,
      uuid: `650e8400-e29b-41d4-a716-44665544000${nextMatchId}`,
      home_team_id,
      away_team_id,
      league,
      match_date: matchDateTime,
      venue: venue || `${homeTeam.name} Stadium`,
      status: 'scheduled',
      season: season || '2024-2025',
      created_at: new Date(),
      updated_at: new Date()
    };

    matches.push(newMatch);

    logger.info('Match created successfully', { id: newMatch.id, league });

    res.status(201).json({
      success: true,
      data: {
        ...newMatch,
        home_team: homeTeam,
        away_team: awayTeam
      },
      message: 'Match created successfully',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Update match result
   */
  updateMatchResult = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { home_score, away_score, status, attendance, home_goals, away_goals } = req.body;
    logger.info('Updating match result', { id, home_score, away_score });

    const matchIndex = matches.findIndex(m => m.id === parseInt(id));
    
    if (matchIndex === -1) {
      throw new NotFoundError(`Match with ID ${id} not found`);
    }

    const match = matches[matchIndex];

    if (match.status === 'completed') {
      throw new ValidationError('Match result has already been recorded');
    }

    // Validate scores
    if (home_score < 0 || away_score < 0) {
      throw new ValidationError('Scores cannot be negative');
    }

    // Update the match
    const updatedMatch = {
      ...match,
      home_score,
      away_score,
      status: status || 'completed',
      attendance,
      home_goals: home_goals || [],
      away_goals: away_goals || [],
      updated_at: new Date()
    };

    matches[matchIndex] = updatedMatch;

    logger.info('Match result updated successfully', { 
      id: updatedMatch.id, 
      score: `${home_score}-${away_score}` 
    });

    res.status(200).json({
      success: true,
      data: {
        ...updatedMatch,
        home_team: mockTeams.find(team => team.id === updatedMatch.home_team_id),
        away_team: mockTeams.find(team => team.id === updatedMatch.away_team_id),
        result: home_score > away_score ? 'Home Win' :
                home_score < away_score ? 'Away Win' : 'Draw'
      },
      message: 'Match result updated successfully',
      timestamp: new Date().toISOString()
    });
  });
}