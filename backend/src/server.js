import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { startSessionCleanup } from './services/auth.js';
import { migrate, isUpToDate } from './db/migrations.js';
import authRoutes from './api/routes/auth.js';
import imagesRoutes from './api/routes/images.js';
import detectionsRoutes from './api/routes/detections.js';
import speciesRoutes from './api/routes/species.js';
import statisticsRoutes from './api/routes/statistics.js';
import mapsRoutes from './api/routes/maps.js';
import { notFoundHandler, errorHandler } from './api/middleware/errorHandler.js';
import logger, { logRequest } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for getting correct IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res, duration);
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/detections', detectionsRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/maps', mapsRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Initialize database and start server
 */
async function startServer() {
  try {
    // Check database status
    logger.info('Checking database...');

    if (!isUpToDate()) {
      logger.warn('Database is not up to date. Run "npm run db:migrate" to apply migrations.');
      logger.warn('Server will start but may not function correctly.');
    } else {
      logger.info('Database is up to date');
    }

    // Start session cleanup
    startSessionCleanup();
    logger.info('Session cleanup started');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`CORS origin: ${corsOptions.origin}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
