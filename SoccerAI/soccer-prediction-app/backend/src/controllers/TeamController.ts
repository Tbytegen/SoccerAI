import { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ConflictError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Mock data store (replace with actual database in production)
let teams: any[] = [
  {
    id: 1,
    uuid: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Manchester United',
    full_name: 'Manchester United Football Club',
    league: 'Premier League',
    country: 'England',
    position: 1,
    points: 0,
    played_games: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    form: '',
    logo_url: null,
    website_url: null,
    founded: 1878,
    stadium: 'Old Trafford',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    uuid: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Liverpool',
    full_name: 'Liverpool Football Club',
    league: 'Premier League',
    country: 'England',
    position: 2,
    points: 0,
    played_games: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    form: '',
    logo_url: null,
    website_url: null,
    founded: 1892,
    stadium: 'Anfield',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    uuid: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Real Madrid',
    full_name: 'Real Madrid Club de Fútbol',
    league: 'La Liga',
    country: 'Spain',
    position: 1,
    points: 0,
    played_games: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    form: '',
    logo_url: null,
    website_url: null,
    founded: 1902,
    stadium: 'Santiago Bernabéu',
    created_at: new Date(),
    updated_at: new Date()
  }
];

let nextId = 4;

export class TeamController {
  /**
   * Get all teams with filtering and pagination
   */
  getAllTeams = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Getting all teams', { query: req.query });

    const {
      league,
      country,
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc',
      search
    } = req.query;

    let filteredTeams = [...teams];

    // Apply filters
    if (league) {
      filteredTeams = filteredTeams.filter(team => team.league === league);
    }

    if (country) {
      filteredTeams = filteredTeams.filter(team => 
        team.country?.toLowerCase().includes(country.toLowerCase())
      );
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredTeams = filteredTeams.filter(team =>
        team.name.toLowerCase().includes(searchTerm) ||
        (team.full_name && team.full_name.toLowerCase().includes(searchTerm)) ||
        (team.league && team.league.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filteredTeams.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] || '';
      const bVal = b[sortBy as keyof typeof b] || '';
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortOrder === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

    const total = filteredTeams.length;
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: paginatedTeams,
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
   * Get team by ID
   */
  getTeamById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info('Getting team by ID', { id });

    const team = teams.find(t => t.id === parseInt(id));
    
    if (!team) {
      throw new NotFoundError(`Team with ID ${id} not found`);
    }

    res.status(200).json({
      success: true,
      data: team,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Create a new team
   */
  createTeam = asyncHandler(async (req: Request, res: Response) => {
    const teamData = req.body;
    logger.info('Creating new team', { name: teamData.name });

    // Check for duplicate team name in the same league
    const existingTeam = teams.find(team => 
      team.name.toLowerCase() === teamData.name.toLowerCase() && 
      team.league === teamData.league
    );

    if (existingTeam) {
      throw new ConflictError(`Team '${teamData.name}' already exists in ${teamData.league}`);
    }

    const newTeam = {
      id: nextId++,
      uuid: `550e8400-e29b-41d4-a716-44665544000${nextId}`,
      ...teamData,
      points: 0,
      played_games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      form: '',
      created_at: new Date(),
      updated_at: new Date()
    };

    teams.push(newTeam);

    logger.info('Team created successfully', { id: newTeam.id, name: newTeam.name });

    res.status(201).json({
      success: true,
      data: newTeam,
      message: 'Team created successfully',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Update a team
   */
  updateTeam = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    logger.info('Updating team', { id, updateData });

    const teamIndex = teams.findIndex(t => t.id === parseInt(id));
    
    if (teamIndex === -1) {
      throw new NotFoundError(`Team with ID ${id} not found`);
    }

    const existingTeam = teams[teamIndex];

    // Check for name conflicts if name is being updated
    if (updateData.name && updateData.name.toLowerCase() !== existingTeam.name.toLowerCase()) {
      const nameConflict = teams.find(team => 
        team.name.toLowerCase() === updateData.name.toLowerCase() && 
        team.league === updateData.league &&
        team.id !== existingTeam.id
      );

      if (nameConflict) {
        throw new ConflictError(`Team '${updateData.name}' already exists in ${updateData.league || existingTeam.league}`);
      }
    }

    // Validate that wins + draws + losses = played_games if all are provided
    if (updateData.wins !== undefined && updateData.draws !== undefined && updateData.losses !== undefined && updateData.played_games !== undefined) {
      if (updateData.wins + updateData.draws + updateData.losses !== updateData.played_games) {
        throw new ValidationError('Wins + Draws + Losses must equal Played Games');
      }
    }

    // Update the team
    const updatedTeam = {
      ...existingTeam,
      ...updateData,
      updated_at: new Date()
    };

    // Recalculate goal difference if goals are updated
    if (updateData.goals_for !== undefined || updateData.goals_against !== undefined) {
      updatedTeam.goal_difference = (updateData.goals_for ?? existingTeam.goals_for) - (updateData.goals_against ?? existingTeam.goals_against);
    }

    teams[teamIndex] = updatedTeam;

    logger.info('Team updated successfully', { id: updatedTeam.id, name: updatedTeam.name });

    res.status(200).json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Delete a team
   */
  deleteTeam = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info('Deleting team', { id });

    const teamIndex = teams.findIndex(t => t.id === parseInt(id));
    
    if (teamIndex === -1) {
      throw new NotFoundError(`Team with ID ${id} not found`);
    }

    const deletedTeam = teams[teamIndex];
    teams.splice(teamIndex, 1);

    logger.info('Team deleted successfully', { id: deletedTeam.id, name: deletedTeam.name });

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get team statistics
   */
  getTeamStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info('Getting team stats', { id });

    const team = teams.find(t => t.id === parseInt(id));
    
    if (!team) {
      throw new NotFoundError(`Team with ID ${id} not found`);
    }

    // Calculate additional stats
    const stats = {
      team: team,
      statistics: {
        win_rate: team.played_games > 0 ? (team.wins / team.played_games) * 100 : 0,
        draw_rate: team.played_games > 0 ? (team.draws / team.played_games) * 100 : 0,
        loss_rate: team.played_games > 0 ? (team.losses / team.played_games) * 100 : 0,
        goals_per_game: team.played_games > 0 ? team.goals_for / team.played_games : 0,
        goals_conceded_per_game: team.played_games > 0 ? team.goals_against / team.played_games : 0,
        goal_difference_per_game: team.played_games > 0 ? team.goal_difference / team.played_games : 0,
        points_per_game: team.played_games > 0 ? team.points / team.played_games : 0,
        defensive_record: team.goals_against === 0 ? 'Excellent' : 
                          team.goals_against < 20 ? 'Good' : 
                          team.goals_against < 40 ? 'Average' : 'Poor'
      }
    };

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get team form
   */
  getTeamForm = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    logger.info('Getting team form', { id, limit });

    const team = teams.find(t => t.id === parseInt(id));
    
    if (!team) {
      throw new NotFoundError(`Team with ID ${id} not found`);
    }

    // Mock form data (replace with actual historical match data)
    const formData = {
      team_id: team.id,
      team_name: team.name,
      current_form: team.form || '',
      form_analysis: {
        recent_trend: 'Mixed form in recent matches',
        confidence_level: 'Medium',
        key_observations: [
          `${team.wins} wins in last ${team.played_games} games`,
          `${team.goals_for} goals scored, ${team.goals_against} conceded`,
          `Average ${team.played_games > 0 ? (team.points / team.played_games).toFixed(2) : '0'} points per game`
        ]
      },
      form_history: [], // This would contain actual historical match results
      limit: parseInt(limit as string)
    };

    res.status(200).json({
      success: true,
      data: formData,
      timestamp: new Date().toISOString()
    });
  });
}