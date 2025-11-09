import { getSession } from '../../services/auth.js';

/**
 * Extract session ID from request
 * Checks Authorization header (Bearer token) or session cookie
 * @param {Object} req - Express request object
 * @returns {string|null} Session ID or null
 */
function extractSessionId(req) {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check session cookie
  if (req.cookies && req.cookies.sessionId) {
    return req.cookies.sessionId;
  }

  return null;
}

/**
 * Authentication middleware
 * Validates session and attaches user to request
 * If session is invalid, returns 401 Unauthorized
 */
export function requireAuth(req, res, next) {
  const sessionId = extractSessionId(req);

  if (!sessionId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  const session = getSession(sessionId);

  if (!session) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired session'
    });
  }

  // Attach session and user to request
  req.session = session;
  req.user = session.user;

  next();
}

/**
 * Role-based authorization middleware
 * Requires user to have specified role
 * Must be used after requireAuth middleware
 * @param {string} role - Required role
 * @returns {Function} Middleware function
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires ${role} role`
      });
    }

    next();
  };
}

/**
 * Admin authorization middleware
 * Shorthand for requireRole('admin')
 */
export const requireAdmin = requireRole('admin');

/**
 * Optional authentication middleware
 * Attaches user to request if session is valid, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const sessionId = extractSessionId(req);

  if (sessionId) {
    const session = getSession(sessionId);
    if (session) {
      req.session = session;
      req.user = session.user;
    }
  }

  next();
}
