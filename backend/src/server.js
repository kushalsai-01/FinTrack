import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import database from './config/database.js';
import redisClient from './config/redis.js';
import routes from './routes/index.js';
import { errorHandler } from './utils/errors.js';
import logger from './utils/logger.js';
import healthScoreJob from './jobs/healthScoreJob.js';
import forecastJob from './jobs/forecastJob.js';
import goalProgressJob from './jobs/goalProgressJob.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Middleware configuration
 */

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

/**
 * Routes
 */
app.use(routes);

/**
 * Error handling
 */
app.use(errorHandler);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
    },
  });
});

/**
 * Server startup
 */
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect(process.env.MONGODB_URI);

    // Connect to Redis (optional - app works without it)
    await redisClient.connect();

    // Start background jobs
    healthScoreJob.start();
    forecastJob.start();
    goalProgressJob.start();

    // Start server
    app.listen(PORT, () => {
      logger.info(`FinSight AI Backend server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.disconnect();
  await redisClient.disconnect();
  process.exit(0);
});

startServer();
