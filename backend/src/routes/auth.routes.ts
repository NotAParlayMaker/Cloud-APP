import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { db } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// Register new user
authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    throw new AppError('Email, password, and username are required', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert user
  const result = await db.query(
    'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
    [email, passwordHash, username]
  );

  const user = result.rows[0];

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] }
  );

  res.status(201).json({
    status: 'success',
    data: {
      user,
      token
    }
  });
}));

// Login
authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user
  const result = await db.query(
    'SELECT id, email, username, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] }
  );

  res.json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    }
  });
}));

// Get current user
authRouter.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    status: 'success',
    data: {
      user: req.user
    }
  });
}));
