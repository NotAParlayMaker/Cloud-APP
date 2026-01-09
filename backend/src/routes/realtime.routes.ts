import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../config/database';

export const realtimeRouter = Router();

/**
 * WebSocket Real-time Updates
 * This route provides endpoints for subscribing to real-time game updates
 * In production, implement with Socket.io or WebSocket
 */

// Get live game updates
realtimeRouter.get(
  '/games/live',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check subscription tier
    const subscription = await db.query(
      `SELECT tier FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.id]
    );

    const tier = subscription.rows[0]?.tier || 'free';

    if (tier === 'free') {
      return res.status(403).json({
        status: 'error',
        message: 'Real-time updates are a premium feature. Please upgrade your subscription.'
      });
    }

    // Get games currently in progress
    const result = await db.query(
      `SELECT
        g.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        s.name as sport_name
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      JOIN sports_types s ON g.sport_type_id = s.id
      WHERE g.status = 'in_progress'
      ORDER BY g.game_date DESC`
    );

    res.json({
      status: 'success',
      data: {
        liveGames: result.rows,
        websocketUrl: 'ws://localhost:3001/realtime',
        message: 'Connect to WebSocket for live updates'
      }
    });
  })
);

// Get game play-by-play
realtimeRouter.get(
  '/games/:gameId/playbyplay',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { gameId } = req.params;

    const result = await db.query(
      `SELECT * FROM play_by_play
       WHERE game_id = $1
       ORDER BY timestamp DESC
       LIMIT 50`,
      [gameId]
    );

    res.json({
      status: 'success',
      data: {
        plays: result.rows
      }
    });
  })
);

// Subscribe to game updates
realtimeRouter.post(
  '/subscribe',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { gameIds, playerIds, teamIds } = req.body;

    // Store subscription preferences
    await db.query(
      `INSERT INTO realtime_subscriptions (user_id, game_ids, player_ids, team_ids, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         game_ids = $2,
         player_ids = $3,
         team_ids = $4,
         updated_at = NOW()`,
      [
        req.user!.id,
        gameIds ? JSON.stringify(gameIds) : null,
        playerIds ? JSON.stringify(playerIds) : null,
        teamIds ? JSON.stringify(teamIds) : null
      ]
    );

    res.json({
      status: 'success',
      message: 'Subscription preferences updated',
      data: {
        subscribedGames: gameIds?.length || 0,
        subscribedPlayers: playerIds?.length || 0,
        subscribedTeams: teamIds?.length || 0
      }
    });
  })
);

// Get real-time stats
realtimeRouter.get(
  '/stats/live',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { gameId } = req.query;

    // Simulated real-time stats - in production, fetch from live data feed
    const liveStats = {
      gameId,
      quarter: 3,
      timeRemaining: '7:32',
      homeScore: 78,
      awayScore: 74,
      lastPlay: 'LeBron James makes 3-point shot (23:15)',
      leadingScorer: {
        name: 'LeBron James',
        points: 28,
        rebounds: 7,
        assists: 9
      },
      momentum: 'home', // home/away/neutral
      keyPlayers: [
        { name: 'LeBron James', status: 'hot', fgPercent: 62.5 },
        { name: 'Stephen Curry', status: 'cold', fgPercent: 31.2 }
      ]
    };

    res.json({
      status: 'success',
      data: liveStats
    });
  })
);
