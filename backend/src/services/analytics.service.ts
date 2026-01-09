import { db } from '../config/database';

export class AnalyticsService {
  async getPlayerTrends(
    playerId: number,
    startDate?: string,
    endDate?: string,
    metric?: string
  ) {
    let query = `
      SELECT
        g.game_date,
        ps.statistics,
        ps.minutes_played,
        g.home_team_id,
        g.away_team_id,
        p.team_id
      FROM player_statistics ps
      JOIN games g ON ps.game_id = g.id
      JOIN players p ON ps.player_id = p.id
      WHERE ps.player_id = $1
    `;

    const params: any[] = [playerId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND g.game_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND g.game_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' ORDER BY g.game_date ASC';

    const result = await db.query(query, params);

    // Process data for trend analysis
    const trends = result.rows.map(row => {
      const stats = row.statistics;
      return {
        date: row.game_date,
        minutesPlayed: row.minutes_played,
        isHome: row.team_id === row.home_team_id,
        stats: metric ? { [metric]: stats[metric] } : stats
      };
    });

    // Calculate moving averages
    const movingAverage = this.calculateMovingAverage(trends, metric || 'points', 5);

    return {
      playerid: playerId,
      trends,
      movingAverage,
      summary: this.calculateSummaryStats(trends, metric)
    };
  }

  async getTeamPerformance(teamId: number, season?: string) {
    const query = `
      SELECT
        g.game_date,
        g.home_team_id,
        g.away_team_id,
        g.home_score,
        g.away_score,
        CASE
          WHEN g.home_team_id = $1 THEN 'home'
          ELSE 'away'
        END as venue,
        CASE
          WHEN (g.home_team_id = $1 AND g.home_score > g.away_score) OR
               (g.away_team_id = $1 AND g.away_score > g.home_score)
          THEN 'win'
          ELSE 'loss'
        END as result
      FROM games g
      WHERE (g.home_team_id = $1 OR g.away_team_id = $1)
        AND g.status = 'completed'
      ORDER BY g.game_date DESC
    `;

    const result = await db.query(query, [teamId]);

    const wins = result.rows.filter(r => r.result === 'win').length;
    const losses = result.rows.filter(r => r.result === 'loss').length;
    const homeWins = result.rows.filter(r => r.result === 'win' && r.venue === 'home').length;
    const awayWins = result.rows.filter(r => r.result === 'win' && r.venue === 'away').length;

    return {
      teamId,
      season,
      record: {
        wins,
        losses,
        winPercentage: wins / (wins + losses)
      },
      homeRecord: {
        wins: homeWins,
        losses: result.rows.filter(r => r.result === 'loss' && r.venue === 'home').length
      },
      awayRecord: {
        wins: awayWins,
        losses: result.rows.filter(r => r.result === 'loss' && r.venue === 'away').length
      },
      recentGames: result.rows.slice(0, 10)
    };
  }

  async getGameStatistics(gameId: number) {
    const gameQuery = `
      SELECT g.*,
             ht.name as home_team_name,
             at.name as away_team_name
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE g.id = $1
    `;

    const statsQuery = `
      SELECT ps.*,
             p.first_name,
             p.last_name,
             p.position,
             t.name as team_name
      FROM player_statistics ps
      JOIN players p ON ps.player_id = p.id
      JOIN teams t ON p.team_id = t.id
      WHERE ps.game_id = $1
    `;

    const [gameResult, statsResult] = await Promise.all([
      db.query(gameQuery, [gameId]),
      db.query(statsQuery, [gameId])
    ]);

    return {
      game: gameResult.rows[0],
      playerStatistics: statsResult.rows
    };
  }

  async comparePlayers(
    playerIds: number[],
    metrics: string[],
    startDate?: string,
    endDate?: string
  ) {
    const comparisons: any[] = [];

    for (const playerId of playerIds) {
      const trends = await this.getPlayerTrends(playerId, startDate, endDate);
      const playerQuery = await db.query(
        'SELECT * FROM players WHERE id = $1',
        [playerId]
      );

      comparisons.push({
        player: playerQuery.rows[0],
        averages: this.calculateAverages(trends.trends, metrics)
      });
    }

    return {
      players: comparisons,
      metrics
    };
  }

  async getLeagueStandings(sportTypeId: number, season?: string) {
    const teamsQuery = await db.query(
      'SELECT id, name FROM teams WHERE sport_type_id = $1',
      [sportTypeId]
    );

    const standings = [];

    for (const team of teamsQuery.rows) {
      const performance = await this.getTeamPerformance(team.id, season);
      standings.push({
        team: team.name,
        teamId: team.id,
        ...performance.record
      });
    }

    // Sort by win percentage
    standings.sort((a, b) => b.winPercentage - a.winPercentage);

    return {
      sportTypeId,
      season,
      standings
    };
  }

  private calculateMovingAverage(data: any[], metric: string, window: number) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = data.slice(start, i + 1);
      const sum = slice.reduce((acc, item) => acc + (item.stats[metric] || 0), 0);
      result.push({
        date: data[i].date,
        value: sum / slice.length
      });
    }
    return result;
  }

  private calculateSummaryStats(trends: any[], metric?: string) {
    if (trends.length === 0) return {};

    const values = trends.map(t => {
      if (metric) {
        return t.stats[metric] || 0;
      }
      return 0;
    });

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const sorted = values.sort((a, b) => a - b);

    return {
      average: avg,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      total: sum,
      games: trends.length
    };
  }

  private calculateAverages(trends: any[], metrics: string[]) {
    const averages: any = {};

    for (const metric of metrics) {
      const values = trends.map(t => t.stats[metric] || 0);
      const sum = values.reduce((a, b) => a + b, 0);
      averages[metric] = sum / values.length;
    }

    return averages;
  }
}
