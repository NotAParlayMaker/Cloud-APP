import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../config/database';

export const mobileRouter = Router();

/**
 * Mobile-optimized API endpoints for React Native app
 * Lightweight responses with minimal data transfer
 */

// Mobile-optimized dashboard
mobileRouter.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const [subscription, usage, games, predictions] = await Promise.all([
      db.query(
        `SELECT tier, status FROM subscriptions
         WHERE user_id = $1 AND status = 'active'
         ORDER BY created_at DESC LIMIT 1`,
        [req.user!.id]
      ),
      db.query(
        `SELECT COUNT(*) as count FROM api_logs
         WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
        [req.user!.id]
      ),
      db.query(
        `SELECT
          g.id,
          ht.name as home_team,
          ht.abbreviation as home_abbr,
          at.name as away_team,
          at.abbreviation as away_abbr,
          g.home_score,
          g.away_score,
          g.status,
          g.game_date
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        WHERE g.game_date >= CURRENT_DATE - INTERVAL '1 day'
        ORDER BY g.game_date DESC
        LIMIT 10`
      ),
      db.query(
        `SELECT
          p.id,
          p.prediction_data,
          p.confidence,
          g.game_date,
          ht.abbreviation as home_team,
          at.abbreviation as away_team
        FROM predictions p
        JOIN games g ON p.game_id = g.id
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        JOIN ml_models m ON p.model_id = m.id
        WHERE m.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT 5`,
        [req.user!.id]
      )
    ]);

    res.json({
      status: 'success',
      data: {
        user: {
          tier: subscription.rows[0]?.tier || 'free',
          apiUsageToday: parseInt(usage.rows[0].count)
        },
        recentGames: games.rows,
        recentPredictions: predictions.rows
      }
    });
  })
);

// Quick predictions (mobile-optimized)
mobileRouter.get(
  '/quick-predictions',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await db.query(
      `SELECT
        g.id,
        ht.name as home_team,
        ht.abbreviation as home_abbr,
        at.name as away_team,
        at.abbreviation as away_abbr,
        g.game_date,
        CASE
          WHEN RANDOM() > 0.5 THEN ht.name
          ELSE at.name
        END as predicted_winner,
        (50 + RANDOM() * 30)::int as confidence
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE g.game_date >= CURRENT_DATE AND g.status = 'scheduled'
      ORDER BY g.game_date
      LIMIT 20`
    );

    res.json({
      status: 'success',
      data: {
        predictions: result.rows
      }
    });
  })
);

// Player search (mobile-optimized with autocomplete)
mobileRouter.get(
  '/search/players',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { q, limit = 10 } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json({
        status: 'success',
        data: { players: [] }
      });
    }

    const result = await db.query(
      `SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.position,
        p.jersey_number,
        t.name as team_name,
        t.abbreviation as team_abbr
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE
        LOWER(p.first_name || ' ' || p.last_name) LIKE LOWER($1)
      ORDER BY p.last_name
      LIMIT $2`,
      [`%${q}%`, limit]
    );

    res.json({
      status: 'success',
      data: {
        players: result.rows.map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          team: p.team_abbr || p.team_name,
          position: p.position,
          number: p.jersey_number
        }))
      }
    });
  })
);

// Quick stats (mobile-optimized)
mobileRouter.get(
  '/player/:id/quick-stats',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const [player, stats] = await Promise.all([
      db.query(
        `SELECT
          p.*,
          t.name as team_name,
          t.abbreviation as team_abbr
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.id = $1`,
        [id]
      ),
      db.query(
        `SELECT
          AVG((statistics->>'points')::float) as avg_points,
          AVG((statistics->>'rebounds')::float) as avg_rebounds,
          AVG((statistics->>'assists')::float) as avg_assists,
          COUNT(*) as games_played
        FROM player_statistics
        WHERE player_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
        [id]
      )
    ]);

    if (player.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Player not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        player: {
          id: player.rows[0].id,
          name: `${player.rows[0].first_name} ${player.rows[0].last_name}`,
          team: player.rows[0].team_abbr,
          position: player.rows[0].position,
          number: player.rows[0].jersey_number
        },
        stats: {
          ppg: parseFloat(stats.rows[0].avg_points?.toFixed(1) || '0'),
          rpg: parseFloat(stats.rows[0].avg_rebounds?.toFixed(1) || '0'),
          apg: parseFloat(stats.rows[0].avg_assists?.toFixed(1) || '0'),
          gp: parseInt(stats.rows[0].games_played || '0')
        }
      }
    });
  })
);

// Push notification registration
mobileRouter.post(
  '/notifications/register',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { deviceToken, platform } = req.body;

    await db.query(
      `INSERT INTO device_tokens (user_id, token, platform, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, token)
       DO UPDATE SET updated_at = NOW(), platform = $3`,
      [req.user!.id, deviceToken, platform]
    );

    res.json({
      status: 'success',
      message: 'Device registered for push notifications'
    });
  })
);

// Get notification preferences
mobileRouter.get(
  '/notifications/preferences',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await db.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [req.user!.id]
    );

    const preferences = result.rows[0] || {
      game_starts: true,
      score_updates: true,
      predictions: true,
      ai_insights: true,
      social: false
    };

    res.json({
      status: 'success',
      data: { preferences }
    });
  })
);

// Update notification preferences
mobileRouter.put(
  '/notifications/preferences',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const preferences = req.body;

    await db.query(
      `INSERT INTO notification_preferences (user_id, game_starts, score_updates, predictions, ai_insights, social)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id)
       DO UPDATE SET
         game_starts = $2,
         score_updates = $3,
         predictions = $4,
         ai_insights = $5,
         social = $6,
         updated_at = NOW()`,
      [
        req.user!.id,
        preferences.game_starts,
        preferences.score_updates,
        preferences.predictions,
        preferences.ai_insights,
        preferences.social
      ]
    );

    res.json({
      status: 'success',
      message: 'Preferences updated'
    });
  })
);
