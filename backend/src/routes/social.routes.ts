import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../config/database';

export const socialRouter = Router();

// Create a prediction post
socialRouter.post(
  '/predictions',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { gameId, prediction, description, confidence } = req.body;

    const result = await db.query(
      `INSERT INTO user_predictions (user_id, game_id, prediction, description, confidence)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user!.id, gameId, JSON.stringify(prediction), description, confidence]
    );

    res.status(201).json({
      status: 'success',
      data: {
        prediction: result.rows[0]
      }
    });
  })
);

// Get community predictions
socialRouter.get(
  '/predictions',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { gameId, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        up.*,
        u.username,
        g.home_team_id,
        g.away_team_id,
        ht.name as home_team_name,
        at.name as away_team_name,
        (SELECT COUNT(*) FROM prediction_votes WHERE prediction_id = up.id AND vote_type = 'upvote') as upvotes,
        (SELECT COUNT(*) FROM prediction_votes WHERE prediction_id = up.id AND vote_type = 'downvote') as downvotes
      FROM user_predictions up
      JOIN users u ON up.user_id = u.id
      JOIN games g ON up.game_id = g.id
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (gameId) {
      query += ` AND up.game_id = $${paramIndex}`;
      params.push(gameId);
      paramIndex++;
    }

    query += ` ORDER BY up.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        predictions: result.rows
      }
    });
  })
);

// Vote on prediction
socialRouter.post(
  '/predictions/:id/vote',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'

    // Remove existing vote if any
    await db.query(
      `DELETE FROM prediction_votes WHERE prediction_id = $1 AND user_id = $2`,
      [id, req.user!.id]
    );

    // Add new vote
    await db.query(
      `INSERT INTO prediction_votes (prediction_id, user_id, vote_type)
       VALUES ($1, $2, $3)`,
      [id, req.user!.id, voteType]
    );

    res.json({
      status: 'success',
      message: 'Vote recorded'
    });
  })
);

// Get leaderboard
socialRouter.get(
  '/leaderboard',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { period = 'all', limit = 10 } = req.query;

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND up.created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "AND up.created_at >= NOW() - INTERVAL '30 days'";
    }

    const result = await db.query(
      `SELECT
        u.id,
        u.username,
        COUNT(up.id) as total_predictions,
        AVG(up.confidence) as avg_confidence,
        SUM(CASE WHEN up.is_correct = true THEN 1 ELSE 0 END) as correct_predictions,
        (SUM(CASE WHEN up.is_correct = true THEN 1 ELSE 0 END)::float /
         NULLIF(COUNT(up.id), 0) * 100) as accuracy
      FROM users u
      LEFT JOIN user_predictions up ON u.id = up.user_id ${dateFilter}
      GROUP BY u.id, u.username
      HAVING COUNT(up.id) > 0
      ORDER BY accuracy DESC, total_predictions DESC
      LIMIT $1`,
      [limit]
    );

    res.json({
      status: 'success',
      data: {
        leaderboard: result.rows
      }
    });
  })
);

// Create discussion/comment
socialRouter.post(
  '/discussions',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { entityType, entityId, content } = req.body;

    const result = await db.query(
      `INSERT INTO discussions (user_id, entity_type, entity_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user!.id, entityType, entityId, content]
    );

    res.status(201).json({
      status: 'success',
      data: {
        discussion: result.rows[0]
      }
    });
  })
);

// Get discussions
socialRouter.get(
  '/discussions',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { entityType, entityId, limit = 50 } = req.query;

    const result = await db.query(
      `SELECT
        d.*,
        u.username,
        (SELECT COUNT(*) FROM discussion_likes WHERE discussion_id = d.id) as likes
      FROM discussions d
      JOIN users u ON d.user_id = u.id
      WHERE d.entity_type = $1 AND d.entity_id = $2
      ORDER BY d.created_at DESC
      LIMIT $3`,
      [entityType, entityId, limit]
    );

    res.json({
      status: 'success',
      data: {
        discussions: result.rows
      }
    });
  })
);

// Follow user
socialRouter.post(
  '/follow/:userId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    await db.query(
      `INSERT INTO user_follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user!.id, userId]
    );

    res.json({
      status: 'success',
      message: 'User followed'
    });
  })
);

// Unfollow user
socialRouter.delete(
  '/follow/:userId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    await db.query(
      `DELETE FROM user_follows
       WHERE follower_id = $1 AND following_id = $2`,
      [req.user!.id, userId]
    );

    res.json({
      status: 'success',
      message: 'User unfollowed'
    });
  })
);

// Get user profile
socialRouter.get(
  '/profile/:userId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    const [userResult, statsResult, followersResult, followingResult] = await Promise.all([
      db.query(
        `SELECT id, username, created_at FROM users WHERE id = $1`,
        [userId]
      ),
      db.query(
        `SELECT
          COUNT(up.id) as total_predictions,
          SUM(CASE WHEN up.is_correct = true THEN 1 ELSE 0 END) as correct_predictions,
          COUNT(DISTINCT d.id) as total_comments
        FROM users u
        LEFT JOIN user_predictions up ON u.id = up.user_id
        LEFT JOIN discussions d ON u.id = d.user_id
        WHERE u.id = $1
        GROUP BY u.id`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1`,
        [userId]
      )
    ]);

    res.json({
      status: 'success',
      data: {
        user: userResult.rows[0],
        stats: statsResult.rows[0],
        followers: parseInt(followersResult.rows[0].count),
        following: parseInt(followingResult.rows[0].count)
      }
    });
  })
);
