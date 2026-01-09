import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AIChatService } from '../services/aiChat.service';
import { db } from '../config/database';

export const aiChatRouter = Router();
const aiChatService = new AIChatService();

// AI Chat endpoint
aiChatRouter.post(
  '/query',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { query, context } = req.body;

    if (!query) {
      throw new AppError('Query is required', 400);
    }

    // Check subscription tier and usage limits
    const subscription = await db.query(
      `SELECT tier FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.id]
    );

    const tier = subscription.rows[0]?.tier || 'free';

    // Check monthly usage for premium tier
    if (tier === 'premium') {
      const usageResult = await db.query(
        `SELECT COUNT(*) as count FROM ai_chat_logs
         WHERE user_id = $1 AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)`,
        [req.user!.id]
      );

      if (parseInt(usageResult.rows[0].count) >= 100) {
        throw new AppError('Monthly AI chat limit reached. Upgrade to Pro for unlimited access.', 403);
      }
    }

    // Free tier doesn't have AI chat access
    if (tier === 'free') {
      throw new AppError('AI chat is a premium feature. Please upgrade your subscription.', 403);
    }

    // Process query
    const response = await aiChatService.processQuery(query, context, req.user!.id);

    // Log usage
    await db.query(
      `INSERT INTO ai_chat_logs (user_id, query, response, tokens_used)
       VALUES ($1, $2, $3, $4)`,
      [req.user!.id, query, response.answer, response.tokensUsed]
    );

    res.json({
      status: 'success',
      data: response
    });
  })
);

// Get chat history
aiChatRouter.get(
  '/history',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT id, query, response, created_at
       FROM ai_chat_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.id, limit, offset]
    );

    res.json({
      status: 'success',
      data: {
        history: result.rows
      }
    });
  })
);

// Suggested queries
aiChatRouter.get(
  '/suggestions',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const suggestions = [
      "Predict LeBron James' points for tonight's game",
      "What's the injury risk for Kevin Durant?",
      "Compare Stephen Curry and Damian Lillard's performance this season",
      "Which team has the best home record in the NBA?",
      "Predict the outcome of Lakers vs Warriors",
      "Show me top performing players this week",
      "What are the latest trends in three-point shooting?",
      "Analyze the Celtics' defensive performance",
      "Who are the most consistent scorers this season?",
      "Predict playoff matchups based on current standings"
    ];

    res.json({
      status: 'success',
      data: { suggestions }
    });
  })
);
