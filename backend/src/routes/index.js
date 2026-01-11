import express from 'express';
import authRoutes from './authRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import healthRoutes from './healthRoutes.js';
import forecastRoutes from './forecastRoutes.js';
import goalRoutes from './goalRoutes.js';

const router = express.Router();

/**
 * Main router
 * Mounts all route modules
 */
const apiVersion = process.env.API_VERSION || 'v1';

router.use(`/api/${apiVersion}/auth`, authRoutes);
router.use(`/api/${apiVersion}/transactions`, transactionRoutes);
router.use(`/api/${apiVersion}/categories`, categoryRoutes);
router.use(`/api/${apiVersion}/analytics`, analyticsRoutes);
router.use(`/api/${apiVersion}/health`, healthRoutes);
router.use(`/api/${apiVersion}/forecast`, forecastRoutes);
router.use(`/api/${apiVersion}/goals`, goalRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FinSight AI Backend is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
