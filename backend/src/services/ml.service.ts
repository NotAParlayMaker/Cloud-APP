import * as tf from '@tensorflow/tfjs-node';
import { db } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';

export class MLService {
  private modelsDir = path.join(__dirname, '../../models');

  constructor() {
    // Ensure models directory exists
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  async trainModel(
    config: {
      name: string;
      description?: string;
      modelType: string;
      sportTypeId: number;
      userId: number;
    },
    trainingData: any[]
  ) {
    try {
      let model: tf.LayersModel;
      let accuracy = 0;

      switch (config.modelType) {
        case 'game_outcome':
          ({ model, accuracy } = await this.trainGameOutcomeModel(trainingData));
          break;
        case 'player_performance':
          ({ model, accuracy } = await this.trainPlayerPerformanceModel(trainingData));
          break;
        case 'injury_risk':
          ({ model, accuracy } = await this.trainInjuryRiskModel(trainingData));
          break;
        default:
          throw new AppError('Invalid model type', 400);
      }

      // Save model
      const modelPath = path.join(this.modelsDir, `${Date.now()}_${config.modelType}`);
      await model.save(`file://${modelPath}`);

      // Save model metadata to database
      const result = await db.query(
        `INSERT INTO ml_models (user_id, name, description, model_type, sport_type_id, file_path, accuracy, training_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          config.userId,
          config.name,
          config.description,
          config.modelType,
          config.sportTypeId,
          modelPath,
          accuracy
        ]
      );

      return result.rows[0];
    } catch (error: any) {
      throw new AppError(`Model training failed: ${error.message}`, 500);
    }
  }

  private async trainGameOutcomeModel(data: any[]) {
    // Simple neural network for binary classification (win/loss)
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Prepare data (simplified - in production you'd do proper feature engineering)
    const features = data.map(d => this.extractGameFeatures(d));
    const labels = data.map(d => d.homeWin ? 1 : 0);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Train
    const history = await model.fit(xs, ys, {
      epochs: 50,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
        }
      }
    });

    const accuracy = history.history.acc[history.history.acc.length - 1] as number;

    // Cleanup tensors
    xs.dispose();
    ys.dispose();

    return { model, accuracy };
  }

  private async trainPlayerPerformanceModel(data: any[]) {
    // Regression model for predicting player stats
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [15], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1 }) // Single output (e.g., points)
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    const features = data.map(d => this.extractPlayerFeatures(d));
    const labels = data.map(d => d.points || 0);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    const history = await model.fit(xs, ys, {
      epochs: 100,
      validationSplit: 0.2
    });

    const mae = history.history.val_mae?.[history.history.val_mae.length - 1] as number || 0;
    const accuracy = 1 - (mae / 30); // Normalize to 0-1 range (assuming max points ~30)

    xs.dispose();
    ys.dispose();

    return { model, accuracy };
  }

  private async trainInjuryRiskModel(data: any[]) {
    // Binary classification for injury risk
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    const features = data.map(d => this.extractInjuryFeatures(d));
    const labels = data.map(d => d.injured ? 1 : 0);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    const history = await model.fit(xs, ys, {
      epochs: 75,
      validationSplit: 0.2
    });

    const accuracy = history.history.acc[history.history.acc.length - 1] as number;

    xs.dispose();
    ys.dispose();

    return { model, accuracy };
  }

  async predictGameOutcome(gameId: number, modelId?: number) {
    const gameData = await db.query('SELECT * FROM games WHERE id = $1', [gameId]);
    if (gameData.rows.length === 0) {
      throw new AppError('Game not found', 404);
    }

    const game = gameData.rows[0];

    // Load model
    let modelPath: string;
    if (modelId) {
      const modelData = await db.query('SELECT * FROM ml_models WHERE id = $1', [modelId]);
      if (modelData.rows.length === 0) {
        throw new AppError('Model not found', 404);
      }
      modelPath = modelData.rows[0].file_path;
    } else {
      // Use default model
      const defaultModel = await db.query(
        'SELECT * FROM ml_models WHERE model_type = $1 ORDER BY accuracy DESC LIMIT 1',
        ['game_outcome']
      );
      if (defaultModel.rows.length === 0) {
        throw new AppError('No trained model available', 404);
      }
      modelPath = defaultModel.rows[0].file_path;
    }

    const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);

    // Prepare features
    const features = this.extractGameFeatures(game);
    const input = tf.tensor2d([features]);

    // Predict
    const prediction = model.predict(input) as tf.Tensor;
    const probability = (await prediction.data())[0];

    // Cleanup
    input.dispose();
    prediction.dispose();
    model.dispose();

    // Save prediction
    const predictionResult = await db.query(
      `INSERT INTO predictions (model_id, game_id, prediction_data, confidence)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        modelId,
        gameId,
        JSON.stringify({ homeWinProbability: probability }),
        probability
      ]
    );

    return {
      gameId,
      prediction: {
        homeWinProbability: probability,
        awayWinProbability: 1 - probability,
        predictedWinner: probability > 0.5 ? 'home' : 'away'
      },
      confidence: probability,
      predictionId: predictionResult.rows[0].id
    };
  }

  async predictPlayerPerformance(playerId: number, gameId: number, metrics: string[]) {
    // Simplified prediction - in production this would use a trained model
    const historicalData = await db.query(
      `SELECT ps.statistics, ps.minutes_played
       FROM player_statistics ps
       JOIN games g ON ps.game_id = g.id
       WHERE ps.player_id = $1
       ORDER BY g.game_date DESC
       LIMIT 10`,
      [playerId]
    );

    if (historicalData.rows.length === 0) {
      throw new AppError('Insufficient historical data', 400);
    }

    // Calculate averages
    const predictions: any = {};
    for (const metric of metrics) {
      const values = historicalData.rows.map(row => row.statistics[metric] || 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      predictions[metric] = avg;
    }

    return {
      playerId,
      gameId,
      predictions,
      confidence: 0.7 // Simplified
    };
  }

  async predictInjuryRisk(playerId: number) {
    // Simplified risk analysis
    const recentGames = await db.query(
      `SELECT ps.minutes_played, g.game_date
       FROM player_statistics ps
       JOIN games g ON ps.game_id = g.id
       WHERE ps.player_id = $1
       ORDER BY g.game_date DESC
       LIMIT 20`,
      [playerId]
    );

    if (recentGames.rows.length === 0) {
      return {
        playerId,
        riskLevel: 'unknown',
        riskScore: 0,
        factors: ['Insufficient data']
      };
    }

    // Simple heuristic: high minutes = higher risk
    const avgMinutes = recentGames.rows.reduce((sum, g) => sum + parseFloat(g.minutes_played), 0) / recentGames.rows.length;
    const riskScore = Math.min(avgMinutes / 40, 1); // Normalize to 0-1

    return {
      playerId,
      riskLevel: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
      riskScore,
      factors: [
        `Average minutes: ${avgMinutes.toFixed(1)}`,
        `Games analyzed: ${recentGames.rows.length}`
      ]
    };
  }

  async getModels(userId: number) {
    const result = await db.query(
      `SELECT m.*, s.name as sport_name
       FROM ml_models m
       LEFT JOIN sports_types s ON m.sport_type_id = s.id
       WHERE m.user_id = $1 OR m.is_public = true
       ORDER BY m.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async getModelMetrics(modelId: number) {
    const modelResult = await db.query('SELECT * FROM ml_models WHERE id = $1', [modelId]);
    if (modelResult.rows.length === 0) {
      throw new AppError('Model not found', 404);
    }

    const predictionsResult = await db.query(
      'SELECT * FROM predictions WHERE model_id = $1',
      [modelId]
    );

    return {
      model: modelResult.rows[0],
      totalPredictions: predictionsResult.rows.length,
      averageConfidence: predictionsResult.rows.reduce((sum, p) => sum + parseFloat(p.confidence), 0) / predictionsResult.rows.length || 0
    };
  }

  // Feature extraction helpers
  private extractGameFeatures(game: any): number[] {
    // Simplified feature extraction - in production you'd include much more
    return [
      game.home_team_id || 0,
      game.away_team_id || 0,
      game.home_score || 0,
      game.away_score || 0,
      0, 0, 0, 0, 0, 0 // Placeholder features
    ];
  }

  private extractPlayerFeatures(player: any): number[] {
    return new Array(15).fill(0).map((_, i) => player[`feature_${i}`] || Math.random());
  }

  private extractInjuryFeatures(player: any): number[] {
    return new Array(20).fill(0).map((_, i) => player[`feature_${i}`] || Math.random());
  }
}
