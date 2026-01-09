import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AnalyticsService } from '../services/analytics.service';

export const analyticsRouter = Router();
const analyticsService = new AnalyticsService();

// Get player performance trends
analyticsRouter.get(
  '/player/:playerId/trends',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { playerId } = req.params;
    const { startDate, endDate, metric } = req.query;

    const trends = await analyticsService.getPlayerTrends(
      parseInt(playerId),
      startDate as string,
      endDate as string,
      metric as string
    );

    res.json({
      status: 'success',
      data: trends
    });
  })
);

// Get team performance analytics
analyticsRouter.get(
  '/team/:teamId/performance',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;
    const { season } = req.query;

    const performance = await analyticsService.getTeamPerformance(
      parseInt(teamId),
      season as string
    );

    res.json({
      status: 'success',
      data: performance
    });
  })
);

// Get game statistics
analyticsRouter.get(
  '/game/:gameId/stats',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { gameId } = req.params;

    const stats = await analyticsService.getGameStatistics(parseInt(gameId));

    res.json({
      status: 'success',
      data: stats
    });
  })
);

// Compare players
analyticsRouter.post(
  '/compare/players',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { playerIds, metrics, startDate, endDate } = req.body;

    const comparison = await analyticsService.comparePlayers(
      playerIds,
      metrics,
      startDate,
      endDate
    );

    res.json({
      status: 'success',
      data: comparison
    });
  })
);

// Get league standings
analyticsRouter.get(
  '/standings/:sportTypeId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sportTypeId } = req.params;
    const { season } = req.query;

    const standings = await analyticsService.getLeagueStandings(
      parseInt(sportTypeId),
      season as string
    );

    res.json({
      status: 'success',
      data: standings
    });
  })
);
