import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { DataIngestionService } from '../services/dataIngestion.service';
import { db } from '../config/database';

export const dataRouter = Router();

// Configure multer for file uploads
const upload = multer({
  dest: process.env.UPLOAD_DIR || './uploads/',
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  }
});

const dataIngestionService = new DataIngestionService();

// Upload CSV/JSON data
dataRouter.post(
  '/upload',
  authenticate,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { name, description, sportTypeId, isPublic } = req.body;

    const result = await dataIngestionService.processFile(
      req.file,
      req.user!.id,
      {
        name,
        description,
        sportTypeId: parseInt(sportTypeId),
        isPublic: isPublic === 'true'
      }
    );

    res.status(201).json({
      status: 'success',
      data: result
    });
  })
);

// Fetch data from external API
dataRouter.post(
  '/import/api',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { source, endpoint, sportTypeId, params } = req.body;

    const result = await dataIngestionService.importFromAPI(
      source,
      endpoint,
      sportTypeId,
      params,
      req.user!.id
    );

    res.status(201).json({
      status: 'success',
      data: result
    });
  })
);

// Get all datasets
dataRouter.get(
  '/datasets',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await db.query(
      `SELECT d.*, s.name as sport_name, u.username
       FROM datasets d
       LEFT JOIN sports_types s ON d.sport_type_id = s.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1 OR d.is_public = true
       ORDER BY d.created_at DESC`,
      [req.user!.id]
    );

    res.json({
      status: 'success',
      data: {
        datasets: result.rows
      }
    });
  })
);

// Get teams
dataRouter.get(
  '/teams',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sportTypeId } = req.query;

    let query = 'SELECT t.*, s.name as sport_name FROM teams t LEFT JOIN sports_types s ON t.sport_type_id = s.id';
    const params: any[] = [];

    if (sportTypeId) {
      query += ' WHERE t.sport_type_id = $1';
      params.push(sportTypeId);
    }

    query += ' ORDER BY t.name';

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        teams: result.rows
      }
    });
  })
);

// Get players
dataRouter.get(
  '/players',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId } = req.query;

    let query = 'SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id';
    const params: any[] = [];

    if (teamId) {
      query += ' WHERE p.team_id = $1';
      params.push(teamId);
    }

    query += ' ORDER BY p.last_name, p.first_name';

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        players: result.rows
      }
    });
  })
);

// Get games
dataRouter.get(
  '/games',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sportTypeId, teamId, startDate, endDate } = req.query;

    let query = `
      SELECT g.*,
             ht.name as home_team_name,
             at.name as away_team_name,
             s.name as sport_name
      FROM games g
      LEFT JOIN teams ht ON g.home_team_id = ht.id
      LEFT JOIN teams at ON g.away_team_id = at.id
      LEFT JOIN sports_types s ON g.sport_type_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (sportTypeId) {
      query += ` AND g.sport_type_id = $${paramIndex}`;
      params.push(sportTypeId);
      paramIndex++;
    }

    if (teamId) {
      query += ` AND (g.home_team_id = $${paramIndex} OR g.away_team_id = $${paramIndex})`;
      params.push(teamId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND g.game_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND g.game_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' ORDER BY g.game_date DESC';

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: {
        games: result.rows
      }
    });
  })
);

// Get sports types
dataRouter.get(
  '/sports',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await db.query('SELECT * FROM sports_types ORDER BY name');

    res.json({
      status: 'success',
      data: {
        sports: result.rows
      }
    });
  })
);
