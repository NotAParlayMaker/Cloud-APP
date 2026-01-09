import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { MLService } from '../services/ml.service';

export const mlRouter = Router();
const mlService = new MLService();

// Train a new model
mlRouter.post(
  '/train',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, modelType, sportTypeId, trainingData } = req.body;

    const model = await mlService.trainModel(
      {
        name,
        description,
        modelType,
        sportTypeId,
        userId: req.user!.id
      },
      trainingData
    );

    res.status(201).json({
      status: 'success',
      data: model
    });
  })
);

// Predict game outcome
mlRouter.post(
  '/predict/game',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { gameId, modelId } = req.body;

    const prediction = await mlService.predictGameOutcome(gameId, modelId);

    res.json({
      status: 'success',
      data: prediction
    });
  })
);

// Predict player performance
mlRouter.post(
  '/predict/player',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { playerId, gameId, metrics } = req.body;

    const prediction = await mlService.predictPlayerPerformance(
      playerId,
      gameId,
      metrics
    );

    res.json({
      status: 'success',
      data: prediction
    });
  })
);

// Get injury risk prediction
mlRouter.get(
  '/predict/injury/:playerId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { playerId } = req.params;

    const riskAnalysis = await mlService.predictInjuryRisk(parseInt(playerId));

    res.json({
      status: 'success',
      data: riskAnalysis
    });
  })
);

// Get all models
mlRouter.get(
  '/models',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const models = await mlService.getModels(req.user!.id);

    res.json({
      status: 'success',
      data: {
        models
      }
    });
  })
);

// Get model performance metrics
mlRouter.get(
  '/models/:modelId/metrics',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { modelId } = req.params;

    const metrics = await mlService.getModelMetrics(parseInt(modelId));

    res.json({
      status: 'success',
      data: metrics
    });
  })
);
