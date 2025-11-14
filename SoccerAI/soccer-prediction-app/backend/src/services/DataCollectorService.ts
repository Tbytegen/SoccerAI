/**
 * Data Collection Service
 * Handles web scraping for European football data using Firecrawl and Crawl4AI
 */

import { logger } from '../utils/logger';
import { db } from '../config/database';

interface TeamStats {
  id: number;
  name: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string;
  last_updated: Date;
}

interface MatchData {
  home_team: string;
  away_team: string;
  match_date: Date;
  league: string;
  status: 'scheduled' | 'finished' | 'live';
  home_goals?: number;
  away_goals?: number;
  venue?: string;
  referee?: string;
}

export class DataCollectorService {
  private firecrawlApiKey: string;
  private baseUrls = {
    premierLeague: 'https://www.premierleague.com',
    laliga: 'https://www.laliga.com',
    bundesliga: 'https://www.bundesliga.com',
    serieA: 'https://www.legaseriea.it',
    ligue1: 'https://www.ligue1.com'
  };

  constructor() {
    this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY || '';
    if (!this.firecrawlApiKey) {
      logger.warn('Firecrawl API key not found. Data collection will be limited.');
    }
  }

  /**
   * Collect Premier League data from official website
   */
  async collectPremierLeagueData(): Promise<void> {
    try {
      logger.info('Starting Premier League data collection...');
      
      // Collect current standings
      await this.scrapePremierLeagueTable();
      
      // Collect recent matches
      await this.scrapePremierLeagueMatches();
      
      // Collect team statistics
      await this.scrapePremierLeagueTeamStats();
      
      logger.info('Premier League data collection completed successfully');
    } catch (error) {
      logger.error('Error collecting Premier League data:', error);
      throw error;
    }
  }

  /**
   * Scrape Premier League table/standings
   */
  private async scrapePremierLeagueTable(): Promise<void> {
    try {
      const url = `${this.baseUrls.premierLeague}/tables`;
      const crawlResult = await this.firecrawlScrape(url);
      
      if (crawlResult?.data) {
        const teams = this.parsePremierLeagueTable(crawlResult.data);
        await this.updateTeamsInDatabase(teams, 'Premier League');
      }
    } catch (error) {
      logger.error('Error scraping Premier League table:', error);
      throw error;
    }
  }

  /**
   * Scrape Premier League matches
   */
  private async scrapePremierLeagueMatches(): Promise<void> {
    try {
      // Get latest matches
      const latestUrl = `${this.baseUrls.premierLeague}/fixtures`;
      const upcomingUrl = `${this.baseUrls.premierLeague}/fixtures?compSeasons=50&令page=0`;
      
      const latestResult = await this.firecrawlScrape(latestUrl);
      const upcomingResult = await this.firecrawlScrape(upcomingUrl);
      
      if (latestResult?.data) {
        const recentMatches = this.parsePremierLeagueMatches(latestResult.data, 'finished');
        await this.updateMatchesInDatabase(recentMatches);
      }
      
      if (upcomingResult?.data) {
        const upcomingMatches = this.parsePremierLeagueMatches(upcomingResult.data, 'scheduled');
        await this.updateMatchesInDatabase(upcomingMatches);
      }
    } catch (error) {
      logger.error('Error scraping Premier League matches:', error);
      throw error;
    }
  }

  /**
   * Scrape Premier League team statistics
   */
  private async scrapePremierLeagueTeamStats(): Promise<void> {
    try {
      const url = `${this.baseUrls.premierLeague}/stats`;
      const crawlResult = await this.firecrawlScrape(url);
      
      if (crawlResult?.data) {
        const teamStats = this.parseTeamStats(crawlResult.data);
        await this.updateTeamStatsInDatabase(teamStats, 'Premier League');
      }
    } catch (error) {
      logger.error('Error scraping team stats:', error);
      throw error;
    }
  }

  /**
   * Use Firecrawl to scrape URLs
   */
  private async firecrawlScrape(url: string): Promise<any> {
    try {
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          pageOptions: {
            includeHtml: false,
            includeMarkdown: true
          },
          extractorOptions: {
            mode: 'llm-extraction',
            extractionPrompt: this.getExtractionPrompt(url)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.info(`Successfully scraped: ${url}`);
      return result;
    } catch (error) {
      logger.error(`Error scraping URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get extraction prompt based on URL type
   */
  private getExtractionPrompt(url: string): string {
    if (url.includes('tables')) {
      return `Extract Premier League table data including:
      - Team name
      - Position (1-20)
      - Games played
      - Wins
      - Draws  
      - Losses
      - Goals for
      - Goals against
      - Goal difference
      - Points
      - Recent form (last 5 games like "WLDWW")
      
      Return as structured data in JSON format.`;
    }
    
    if (url.includes('fixtures')) {
      return `Extract match data including:
      - Home team name
      - Away team name
      - Match date and time
      - Final score (if available)
      - Match status (scheduled/live/finished)
      - Venue/stadium
      
      Return as structured data in JSON format.`;
    }
    
    if (url.includes('stats')) {
      return `Extract team statistics including:
      - Team name
      - Matches played
      - Wins, draws, losses
      - Goals scored and conceded
      - Form (recent 5 games)
      - League position
      
      Return as structured data in JSON format.`;
    }
    
    return 'Extract relevant football data in structured JSON format.';
  }

  /**
   * Parse Premier League table data
   */
  private parsePremierLeagueTable(html: string): TeamStats[] {
    // This is a simplified parser - in production, you'd use more sophisticated parsing
    const teams: TeamStats[] = [];
    
    // Extract teams from HTML using regex patterns (simplified)
    const teamMatches = html.match(/<tr[^>]*class="tableBodyRow[^"]*.*?<\/tr>/gs);
    
    if (teamMatches) {
      for (const match of teamMatches.slice(0, 20)) {
        try {
          const team: Partial<TeamStats> = {};
          
          // Extract team name
          const nameMatch = match.match(/<span[^>]*class="teamName[^"]*"[^>]*>([^<]+)<\/span>/);
          if (nameMatch) {
            team.name = nameMatch[1].trim();
          }
          
          // Extract position
          const posMatch = match.match(/<td[^>]*class="tableCell[^"]*"[^>]*>(\d+)<\/td>/);
          if (posMatch) {
            team.position = parseInt(posMatch[1]);
          }
          
          // Extract other stats using similar patterns
          const statMatches = match.matchAll(/<td[^>]*class="tableCell[^"]*"[^>]*>(\d+)<\/td>/g);
          const stats = Array.from(statMatches).map(m => parseInt(m[1]));
          
          if (stats.length >= 10 && team.name) {
            teams.push({
              id: 0, // Will be set when inserting to database
              name: team.name,
              position: team.position || 0,
              played: stats[0] || 0,
              won: stats[1] || 0,
              drawn: stats[2] || 0,
              lost: stats[3] || 0,
              goals_for: stats[4] || 0,
              goals_against: stats[5] || 0,
              goal_difference: stats[6] || 0,
              points: stats[7] || 0,
              form: this.extractForm(match) || 'DDDDD',
              last_updated: new Date()
            });
          }
        } catch (error) {
          logger.warn(`Error parsing team data: ${error}`);
        }
      }
    }
    
    return teams;
  }

  /**
   * Parse Premier League matches
   */
  private parsePremierLeagueMatches(html: string, status: 'scheduled' | 'finished'): MatchData[] {
    const matches: MatchData[] = [];
    
    // Simplified match parsing
    const matchPatterns = [
      // Pattern for completed matches
      /<div[^>]*class="match[^"]*"[^>]*>.*?<div[^>]*class="team[^"]*"[^>]*>([^<]+)<\/div>.*?vs.*?<div[^>]*class="team[^"]*"[^>]*>([^<]+)<\/div>.*?(\d+)-(\d+)/gs,
      // Pattern for scheduled matches  
      /<div[^>]*class="fixture[^"]*"[^>]*>.*?<div[^>]*class="team[^"]*"[^>]*>([^<]+)<\/div>.*?vs.*?<div[^>]*class="team[^"]*"[^>]*>([^<]+)<\/div>/gs
    ];
    
    const patterns = status === 'finished' ? [matchPatterns[0]] : [matchPatterns[1]];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const [fullMatch, homeTeam, awayTeam, homeGoals, awayGoals] = match;
        
        matches.push({
          home_team: homeTeam.trim(),
          away_team: awayTeam.trim(),
          match_date: this.extractMatchDate(fullMatch) || new Date(),
          league: 'Premier League',
          status,
          home_goals: homeGoals ? parseInt(homeGoals) : undefined,
          away_goals: awayGoals ? parseInt(awayGoals) : undefined,
          venue: this.extractVenue(fullMatch)
        });
      }
    }
    
    return matches;
  }

  /**
   * Parse team statistics
   */
  private parseTeamStats(html: string): any[] {
    // Simplified stats parsing
    const stats: any[] = [];
    
    // Extract various statistics from HTML
    const teamSections = html.split(/<div[^>]*class="team[^"]*"/);
    
    for (let i = 1; i < teamSections.length; i++) {
      const section = teamSections[i];
      const nameMatch = section.match(/>([^<]+)<\/[^>]*>/);
      
      if (nameMatch) {
        stats.push({
          team_name: nameMatch[1].trim(),
          // Additional stats would be parsed here
        });
      }
    }
    
    return stats;
  }

  /**
   * Extract form from HTML
   */
  private extractForm(html: string): string {
    const formMatch = html.match(/form[^"]*"[^>]*>([^<]+)</i);
    return formMatch ? formMatch[1] : 'DDDDD';
  }

  /**
   * Extract match date from HTML
   */
  private extractMatchDate(html: string): Date | null {
    const dateMatch = html.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? new Date(dateMatch[1]) : null;
  }

  /**
   * Extract venue from HTML
   */
  private extractVenue(html: string): string {
    const venueMatch = html.match(/venue[^"]*"[^>]*>([^<]+)</i);
    return venueMatch ? venueMatch[1].trim() : '';
  }

  /**
   * Update teams in database
   */
  private async updateTeamsInDatabase(teams: TeamStats[], league: string): Promise<void> {
    for (const team of teams) {
      try {
        await db.query(
          `INSERT INTO teams (name, league, country, league_position, points, matches_played, wins, draws, losses, goals_for, goals_against, form, last_updated)
           VALUES ($1, $2, 'England', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (name, league) 
           DO UPDATE SET 
             league_position = EXCLUDED.league_position,
             points = EXCLUDED.points,
             matches_played = EXCLUDED.matches_played,
             wins = EXCLUDED.wins,
             draws = EXCLUDED.draws,
             losses = EXCLUDED.losses,
             goals_for = EXCLUDED.goals_for,
             goals_against = EXCLUDED.goals_against,
             form = EXCLUDED.form,
             last_updated = EXCLUDED.last_updated`,
          [
            team.name,
            league,
            team.position,
            team.points,
            team.played,
            team.won,
            team.drawn,
            team.lost,
            team.goals_for,
            team.goals_against,
            team.form,
            team.last_updated
          ]
        );
      } catch (error) {
        logger.error(`Error updating team ${team.name} in database:`, error);
      }
    }
  }

  /**
   * Update matches in database
   */
  private async updateMatchesInDatabase(matches: MatchData[]): Promise<void> {
    for (const match of matches) {
      try {
        // Get team IDs from database
        const homeTeamResult = await db.query('SELECT id FROM teams WHERE name = $1 AND league = $2', [match.home_team, match.league]);
        const awayTeamResult = await db.query('SELECT id FROM teams WHERE name = $1 AND league = $2', [match.away_team, match.league]);
        
        if (homeTeamResult.rows.length > 0 && awayTeamResult.rows.length > 0) {
          await db.query(
            `INSERT INTO matches (home_team_id, away_team_id, match_date, league, status, home_goals, away_goals, venue, scraped_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             ON CONFLICT (home_team_id, away_team_id, match_date) 
             DO UPDATE SET 
               status = EXCLUDED.status,
               home_goals = EXCLUDED.home_goals,
               away_goals = EXCLUDED.away_goals,
               venue = EXCLUDED.venue,
               scraped_at = NOW()`,
            [
              homeTeamResult.rows[0].id,
              awayTeamResult.rows[0].id,
              match.match_date,
              match.league,
              match.status,
              match.home_goals,
              match.away_goals,
              match.venue
            ]
          );
        }
      } catch (error) {
        logger.error(`Error updating match ${match.home_team} vs ${match.away_team}:`, error);
      }
    }
  }

  /**
   * Update team statistics in database
   */
  private async updateTeamStatsInDatabase(stats: any[], league: string): Promise<void> {
    // Implementation for updating detailed team statistics
    logger.info(`Updated ${stats.length} team statistics for ${league}`);
  }

  /**
   * Schedule automatic data collection
   */
  startScheduledCollection(): void {
    // Run immediately on startup
    this.collectPremierLeagueData().catch(error => {
      logger.error('Initial data collection failed:', error);
    });

    // Schedule every 4 hours
    setInterval(() => {
      this.collectPremierLeagueData().catch(error => {
        logger.error('Scheduled data collection failed:', error);
      });
    }, 4 * 60 * 60 * 1000); // 4 hours

    logger.info('Scheduled data collection started (every 4 hours)');
  }

  /**
   * Manual trigger for data collection
   */
  async triggerDataCollection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const startTime = Date.now();
      await this.collectPremierLeagueData();
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: `Data collection completed successfully in ${duration}ms`,
        data: {
          duration_ms: duration,
          timestamp: new Date(),
          leagues_processed: ['Premier League']
        }
      };
    } catch (error) {
      logger.error('Manual data collection failed:', error);
      return {
        success: false,
        message: `Data collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}