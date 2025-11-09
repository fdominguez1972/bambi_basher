import express from 'express';
import {
  authenticateUser,
  createSession,
  deleteSession,
  createUser
} from '../../services/auth.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required'
      });
    }

    // Authenticate user
    const user = await authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      });
    }

    // Create session
    const session = createSession(user.id);

    res.json({
      message: 'Login successful',
      session: {
        id: session.id,
        expires_at: session.expires_at
      },
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Delete current session
 */
router.post('/logout', requireAuth, (req, res, next) => {
  try {
    const sessionId = req.session.id;
    deleteSession(sessionId);

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

/**
 * POST /api/auth/users
 * Create a new user (admin only)
 */
router.post('/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required'
      });
    }

    const user = await createUser(username, password, role || 'user');

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    // Handle duplicate username error
    if (error.message === 'Username already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }

    next(error);
  }
});

export default router;
