import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine log directory
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      // Filter out common fields that are already displayed
      const { timestamp: _, level: __, message: ___, ...rest } = metadata;
      if (Object.keys(rest).length > 0) {
        msg += ` ${JSON.stringify(rest)}`;
      }
    }

    return msg;
  })
);

// Create transports
const transports = [];

// Console transport (always enabled in development)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: 'info'
    })
  );
}

// File transports (error and combined logs)
transports.push(
  // Error log
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  // Combined log
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
export function logRequest(req, res, duration) {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  };

  if (req.user) {
    logData.user = req.user.username;
  }

  if (res.statusCode >= 500) {
    logger.error('HTTP Request Error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request Warning', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
}

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export function logError(error, context = {}) {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  });
}

/**
 * Log security event
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
export function logSecurityEvent(event, details = {}) {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Create a child logger with additional default metadata
 * @param {Object} defaultMeta - Default metadata
 * @returns {winston.Logger} Child logger
 */
export function createChildLogger(defaultMeta) {
  return logger.child(defaultMeta);
}

export default logger;
