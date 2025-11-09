import { logError } from '../../utils/logger.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found (404) error handler
 * Catches all requests that don't match any routes
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    path: req.url
  });
}

/**
 * Global error handler middleware
 * Handles all errors passed to next(error)
 */
export function errorHandler(err, req, res, next) {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || {};

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = { errors: err.errors };
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
    details = { limit: err.limit };
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    message = 'Database constraint violation';
  }

  // Log error (except for client errors)
  if (statusCode >= 500) {
    logError(err, {
      method: req.method,
      url: req.url,
      user: req.user?.username,
      ip: req.ip || req.connection.remoteAddress
    });
  }

  // Prepare error response
  const errorResponse = {
    error: getErrorName(statusCode),
    message,
    ...(Object.keys(details).length > 0 && { details })
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Get error name from status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error name
 */
function getErrorName(statusCode) {
  const errorNames = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    413: 'Payload Too Large',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };

  return errorNames[statusCode] || 'Error';
}

/**
 * Async route handler wrapper
 * Catches async errors and passes them to error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create an error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional details
 * @returns {AppError} App error
 */
export function createError(message, statusCode = 500, details = {}) {
  return new AppError(message, statusCode, details);
}
