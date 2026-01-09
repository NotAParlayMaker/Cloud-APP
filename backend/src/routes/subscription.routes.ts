import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../config/database';

export const subscriptionRouter = Router();

// Subscription tiers
export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro'
}

// Get subscription features
subscriptionRouter.get(
  '/features',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const features = {
      free: {
        tier: 'Free',
        price: '$0/month',
        features: [
          'Basic data ingestion from public APIs',
          'Upload up to 5 datasets',
          'Simple dashboards and visualizations',
          'Community dataset access',
          'Basic player/team statistics',
          '10 API requests per day'
        ]
      },
      premium: {
        tier: 'Premium',
        price: '$19/month',
        features: [
          'Everything in Free',
          'AI-powered game predictions',
          'Player performance forecasting',
          'Injury risk analysis',
          'Advanced ML models',
          'Real-time game updates',
          'AI chat assistant (100 queries/month)',
          'Unlimited datasets',
          'Custom model training',
          'Export to CSV/Excel',
          '1,000 API requests per day'
        ]
      },
      pro: {
        tier: 'Professional',
        price: '$99/month',
        features: [
          'Everything in Premium',
          'Advanced AI chat (unlimited queries)',
          'Transfer learning models',
          'Real-time visualizations',
          'Fantasy league integrations',
          'Betting analytics',
          'API access for third-party apps',
          'White-label solutions',
          'Priority support',
          'Custom data feeds',
          'Unlimited API requests',
          'Team collaboration (up to 10 users)'
        ]
      }
    };

    res.json({
      status: 'success',
      data: features
    });
  })
);

// Get user subscription
subscriptionRouter.get(
  '/current',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await db.query(
      `SELECT
        s.*,
        u.email,
        u.username
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.user!.id]
    );

    const subscription = result.rows[0] || {
      tier: SubscriptionTier.FREE,
      status: 'active'
    };

    res.json({
      status: 'success',
      data: { subscription }
    });
  })
);

// Create subscription (Stripe integration)
subscriptionRouter.post(
  '/create',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tier, paymentMethodId } = req.body;

    // Validate tier
    if (!Object.values(SubscriptionTier).includes(tier)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subscription tier'
      });
    }

    // For MVP, create subscription without actual payment processing
    // In production, integrate with Stripe
    const result = await db.query(
      `INSERT INTO subscriptions (user_id, tier, status, started_at)
       VALUES ($1, $2, 'active', NOW())
       RETURNING *`,
      [req.user!.id, tier]
    );

    res.status(201).json({
      status: 'success',
      data: {
        subscription: result.rows[0],
        message: 'Subscription created successfully'
      }
    });
  })
);

// Cancel subscription
subscriptionRouter.post(
  '/cancel',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await db.query(
      `UPDATE subscriptions
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE user_id = $1 AND status = 'active'`,
      [req.user!.id]
    );

    res.json({
      status: 'success',
      message: 'Subscription cancelled successfully'
    });
  })
);

// Get usage statistics
subscriptionRouter.get(
  '/usage',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const today = new Date().toISOString().split('T')[0];

    const [apiUsage, datasetsCount, predictionsCount, chatQueries] = await Promise.all([
      db.query(
        `SELECT COUNT(*) as count FROM api_logs
         WHERE user_id = $1 AND DATE(created_at) = $2`,
        [req.user!.id, today]
      ),
      db.query(
        `SELECT COUNT(*) as count FROM datasets WHERE user_id = $1`,
        [req.user!.id]
      ),
      db.query(
        `SELECT COUNT(*) as count FROM predictions p
         JOIN ml_models m ON p.model_id = m.id
         WHERE m.user_id = $1 AND DATE(p.created_at) = $2`,
        [req.user!.id, today]
      ),
      db.query(
        `SELECT COUNT(*) as count FROM ai_chat_logs
         WHERE user_id = $1 AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)`,
        [req.user!.id]
      )
    ]);

    res.json({
      status: 'success',
      data: {
        usage: {
          apiRequestsToday: parseInt(apiUsage.rows[0].count),
          totalDatasets: parseInt(datasetsCount.rows[0].count),
          predictionsToday: parseInt(predictionsCount.rows[0].count),
          chatQueriesThisMonth: parseInt(chatQueries.rows[0].count)
        }
      }
    });
  })
);
