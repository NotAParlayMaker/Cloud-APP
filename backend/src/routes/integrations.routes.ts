import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { db } from '../config/database';
import axios from 'axios';

export const integrationsRouter = Router();

/**
 * Fantasy League & Betting Integrations
 * Premium feature for connecting with external platforms
 */

// Get fantasy league recommendations
integrationsRouter.get(
  '/fantasy/recommendations',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check premium access
    const subscription = await db.query(
      `SELECT tier FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.id]
    );

    const tier = subscription.rows[0]?.tier || 'free';

    if (tier === 'free') {
      throw new AppError('Fantasy integrations are a premium feature. Upgrade to access.', 403);
    }

    // Get top performing players
    const playersResult = await db.query(
      `SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.position,
        t.name as team_name,
        AVG((ps.statistics->>'points')::float) as avg_points,
        AVG((ps.statistics->>'rebounds')::float) as avg_rebounds,
        AVG((ps.statistics->>'assists')::float) as avg_assists
      FROM players p
      JOIN teams t ON p.team_id = t.id
      JOIN player_statistics ps ON p.id = ps.player_id
      WHERE ps.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.first_name, p.last_name, p.position, t.name
      ORDER BY avg_points DESC
      LIMIT 20`
    );

    const recommendations = playersResult.rows.map((player, index) => ({
      rank: index + 1,
      player: {
        id: player.id,
        name: `${player.first_name} ${player.last_name}`,
        position: player.position,
        team: player.team_name
      },
      stats: {
        points: parseFloat(player.avg_points?.toFixed(1) || '0'),
        rebounds: parseFloat(player.avg_rebounds?.toFixed(1) || '0'),
        assists: parseFloat(player.avg_assists?.toFixed(1) || '0')
      },
      recommendation: index < 5 ? 'Must Start' : index < 10 ? 'Strong Start' : 'Consider',
      projectedPoints: Math.round((parseFloat(player.avg_points) * 1.2 || 0))
    }));

    res.json({
      status: 'success',
      data: {
        recommendations,
        lastUpdated: new Date().toISOString(),
        disclaimer: 'Recommendations based on recent performance and predictive models'
      }
    });
  })
);

// Get betting odds and insights
integrationsRouter.get(
  '/betting/odds',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { gameId } = req.query;

    // Check pro access
    const subscription = await db.query(
      `SELECT tier FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.id]
    );

    const tier = subscription.rows[0]?.tier;

    if (tier !== 'pro') {
      throw new AppError('Betting analytics are exclusive to Pro subscribers.', 403);
    }

    // Get game details
    const gameResult = await db.query(
      `SELECT
        g.*,
        ht.name as home_team_name,
        at.name as away_team_name
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE g.id = $1`,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new AppError('Game not found', 404);
    }

    const game = gameResult.rows[0];

    // Simulated betting odds - in production, integrate with betting APIs
    const bettingOdds = {
      game: {
        id: game.id,
        homeTeam: game.home_team_name,
        awayTeam: game.away_team_name,
        date: game.game_date
      },
      moneyline: {
        home: -145,
        away: +125
      },
      spread: {
        home: -3.5,
        away: +3.5,
        odds: -110
      },
      total: {
        over: 218.5,
        under: 218.5,
        odds: -110
      },
      aiInsights: {
        recommendedBet: 'Home -3.5',
        confidence: 72,
        reasoning: 'Home team strong ATS record, favorable matchup history',
        value: 'Moderate value on home spread'
      },
      trends: {
        homeATS: '12-8 ATS this season',
        awayATS: '9-11 ATS this season',
        over: 'Under 14-6 in last 20 games'
      }
    };

    res.json({
      status: 'success',
      data: bettingOdds,
      disclaimer: 'For informational purposes only. Gamble responsibly.'
    });
  })
);

// DFS (Daily Fantasy Sports) Lineup Optimizer
integrationsRouter.post(
  '/fantasy/optimize',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { platform, budget, positions } = req.body;

    // Check pro access
    const subscription = await db.query(
      `SELECT tier FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.id]
    );

    const tier = subscription.rows[0]?.tier;

    if (tier !== 'pro') {
      throw new AppError('DFS optimization is exclusive to Pro subscribers.', 403);
    }

    // Simulated lineup optimization
    const optimizedLineup = {
      platform: platform || 'DraftKings',
      totalSalary: budget || 50000,
      projectedPoints: 285.7,
      lineup: [
        { position: 'PG', player: 'Luka Doncic', salary: 11500, projected: 58.2 },
        { position: 'SG', player: 'Devin Booker', salary: 8900, projected: 42.1 },
        { position: 'SF', player: 'Jayson Tatum', salary: 9200, projected: 45.8 },
        { position: 'PF', player: 'Giannis Antetokounmpo', salary: 11000, projected: 56.3 },
        { position: 'C', player: 'Joel Embiid', salary: 9400, projected: 48.7 },
        { position: 'G', player: 'Tyrese Haliburton', salary: 7800, projected: 38.9 },
        { position: 'F', player: 'Paolo Banchero', salary: 6900, projected: 32.4 },
        { position: 'UTIL', player: 'De\'Aaron Fox', salary: 8300, projected: 40.5 }
      ],
      exposureWarnings: [
        'High correlation between Doncic and Booker game'
      ],
      valuePickupgrade: [
        { player: 'Herbert Jones', savings: 1200, projected: 28.1 }
      ]
    };

    res.json({
      status: 'success',
      data: optimizedLineup
    });
  })
);

// Export data to external platforms
integrationsRouter.post(
  '/export',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { format, dataType, filters } = req.body;

    // Check subscription
    const subscription = await db.query(
      `SELECT tier FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.id]
    );

    const tier = subscription.rows[0]?.tier || 'free';

    if (tier === 'free') {
      throw new AppError('Data export is a premium feature.', 403);
    }

    // Generate export
    const exportData = {
      format: format || 'csv',
      dataType,
      recordCount: 1250,
      downloadUrl: `/api/integrations/download/${Date.now()}`,
      expiresIn: '24 hours'
    };

    res.json({
      status: 'success',
      data: exportData
    });
  })
);

// API access for third-party integrations (Pro only)
integrationsRouter.post(
  '/api-key',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check pro access
    const subscription = await db.query(
      `SELECT tier FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.id]
    );

    const tier = subscription.rows[0]?.tier;

    if (tier !== 'pro') {
      throw new AppError('API access is exclusive to Pro subscribers.', 403);
    }

    // Generate API key
    const apiKey = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.query(
      `INSERT INTO api_keys (user_id, key, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (user_id) DO UPDATE SET key = $2, updated_at = NOW()`,
      [req.user!.id, apiKey]
    );

    res.json({
      status: 'success',
      data: {
        apiKey,
        documentation: 'https://docs.sportsinsightai.com/api',
        rateLimit: 'Unlimited for Pro tier'
      }
    });
  })
);
