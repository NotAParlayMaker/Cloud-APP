import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { dataRouter } from './routes/data.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { mlRouter } from './routes/ml.routes';
import { subscriptionRouter } from './routes/subscription.routes';
import { aiChatRouter } from './routes/aiChat.routes';
import { socialRouter } from './routes/social.routes';
import { realtimeRouter } from './routes/realtime.routes';
import { integrationsRouter } from './routes/integrations.routes';
import { mobileRouter } from './routes/mobile.routes';
import { db } from './config/database';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Core API Routes
app.use('/api/auth', authRouter);
app.use('/api/data', dataRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ml', mlRouter);

// Premium Features Routes
app.use('/api/subscription', subscriptionRouter);
app.use('/api/ai-chat', aiChatRouter);
app.use('/api/social', socialRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/mobile', mobileRouter);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SportsInsight AI - Premium Sports Analytics Platform',
    version: '2.0.0',
    tagline: 'AI-Powered Sports Data & Predictions',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      data: '/api/data',
      analytics: '/api/analytics',
      ml: '/api/ml',
      subscription: '/api/subscription',
      aiChat: '/api/ai-chat',
      social: '/api/social',
      realtime: '/api/realtime',
      integrations: '/api/integrations',
      mobile: '/api/mobile'
    },
    tiers: {
      free: ['Basic data ingestion', 'Simple dashboards', 'Community data', '10 API calls/day'],
      premium: ['AI predictions', 'Advanced analytics', 'AI chat (100/month)', '1K API calls/day'],
      pro: ['Fantasy integrations', 'Betting analytics', 'Unlimited AI chat', 'API access', 'White-label']
    },
    documentation: 'https://docs.sportsinsightai.com',
    github: 'https://github.com/opensportsanalytics/sportsinsight-ai'
  });
});

// Error handling
app.use(errorHandler);

// Database initialization and server start
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🏀 SportsInsight AI - Premium Sports Analytics Platform v2.0.0`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📈 Features: Subscription Tiers | AI Chat | Real-time Updates | Integrations`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
