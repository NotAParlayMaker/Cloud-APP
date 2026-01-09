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

    // Insert default sports types
    await client.query(`
      INSERT INTO sports_types (name, description)
      VALUES
        ('Basketball', 'Professional and amateur basketball'),
        ('Football', 'American football (NFL)'),
        ('Soccer', 'Association football'),
        ('Baseball', 'Professional and amateur baseball'),
        ('Hockey', 'Ice hockey')
      ON CONFLICT (name) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
