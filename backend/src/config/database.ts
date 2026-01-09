import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'opensportsanalytics',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

export const db = {
  query: (text: string, params?: any[]): Promise<QueryResult> => {
    return pool.query(text, params);
  },
  getClient: () => {
    return pool.connect();
  }
};

// Database initialization SQL
export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sports types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sports_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        sport_type_id INTEGER REFERENCES sports_types(id),
        name VARCHAR(255) NOT NULL,
        abbreviation VARCHAR(10),
        city VARCHAR(100),
        founded_year INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        position VARCHAR(50),
        jersey_number INTEGER,
        birth_date DATE,
        height_cm DECIMAL(5,2),
        weight_kg DECIMAL(5,2),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Games table
    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        sport_type_id INTEGER REFERENCES sports_types(id),
        home_team_id INTEGER REFERENCES teams(id),
        away_team_id INTEGER REFERENCES teams(id),
        game_date TIMESTAMP NOT NULL,
        venue VARCHAR(255),
        home_score INTEGER,
        away_score INTEGER,
        status VARCHAR(50) DEFAULT 'scheduled',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Player statistics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_statistics (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        player_id INTEGER REFERENCES players(id),
        minutes_played DECIMAL(5,2),
        statistics JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Datasets table (for user-uploaded data)
    await client.query(`
      CREATE TABLE IF NOT EXISTS datasets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sport_type_id INTEGER REFERENCES sports_types(id),
        file_path VARCHAR(500),
        record_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ML Models table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ml_models (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        model_type VARCHAR(100) NOT NULL,
        sport_type_id INTEGER REFERENCES sports_types(id),
        file_path VARCHAR(500),
        accuracy DECIMAL(5,4),
        training_date TIMESTAMP,
        is_public BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Predictions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        model_id INTEGER REFERENCES ml_models(id),
        game_id INTEGER REFERENCES games(id),
        prediction_data JSONB NOT NULL,
        confidence DECIMAL(5,4),
        actual_outcome JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Subscriptions table (Premium Features)
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        tier VARCHAR(20) DEFAULT 'free',
        status VARCHAR(20) DEFAULT 'active',
        started_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // AI Chat logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User predictions (Social Feature)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_predictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        game_id INTEGER REFERENCES games(id),
        prediction JSONB NOT NULL,
        description TEXT,
        confidence DECIMAL(5,4),
        is_correct BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Prediction votes
    await client.query(`
      CREATE TABLE IF NOT EXISTS prediction_votes (
        id SERIAL PRIMARY KEY,
        prediction_id INTEGER REFERENCES user_predictions(id),
        user_id INTEGER REFERENCES users(id),
        vote_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(prediction_id, user_id)
      );
    `);

    // Discussions/Comments
    await client.query(`
      CREATE TABLE IF NOT EXISTS discussions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Discussion likes
    await client.query(`
      CREATE TABLE IF NOT EXISTS discussion_likes (
        id SERIAL PRIMARY KEY,
        discussion_id INTEGER REFERENCES discussions(id),
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(discussion_id, user_id)
      );
    `);

    // User follows
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id),
        following_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      );
    `);

    // API logs (for rate limiting)
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        endpoint VARCHAR(255),
        method VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_api_logs_user_date ON api_logs(user_id, created_at);
    `);

    // Real-time subscriptions
    await client.query(`
      CREATE TABLE IF NOT EXISTS realtime_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        game_ids JSONB,
        player_ids JSONB,
        team_ids JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Play-by-play (for real-time updates)
    await client.query(`
      CREATE TABLE IF NOT EXISTS play_by_play (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        quarter INTEGER,
        time_remaining VARCHAR(10),
        event_type VARCHAR(50),
        description TEXT,
        score_home INTEGER,
        score_away INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // API keys (for Pro tier)
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        key VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Device tokens (for mobile push notifications)
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        token VARCHAR(500) NOT NULL,
        platform VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, token)
      );
    `);

    // Notification preferences
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        game_starts BOOLEAN DEFAULT true,
        score_updates BOOLEAN DEFAULT true,
        predictions BOOLEAN DEFAULT true,
        ai_insights BOOLEAN DEFAULT true,
        social BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default sports types
    await client.query(`
      INSERT INTO sports_types (name, description)
      VALUES
        ('Basketball', 'Professional and amateur basketball'),
        ('Football', 'American football (NFL)'),
        ('Soccer', 'Association football'),
        ('Baseball', 'Professional and amateur baseball'),
        ('Hockey', 'Ice hockey'),
        ('Cricket', 'Cricket leagues and tournaments'),
        ('Esports', 'Competitive gaming and esports')
      ON CONFLICT (name) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully (Premium features included)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
