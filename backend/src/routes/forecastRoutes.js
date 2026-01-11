import express from 'express';
import { body, query } from 'express-validator';
import forecastController from '../controllers/forecastController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * Forecast routes
 * All routes require authentication
 */
router.use(authenticate);

// Generate forecast
router.post(
  '/generate',
  [body('forecastType').optional().isIn(['7day', '14day', '30day'])],
  validate,
  forecastController.generate
);

// Get latest forecast
router.get(
  '/latest',
  [query('forecastType').optional().isIn(['7day', '14day', '30day'])],
  validate,
  forecastController.getLatest
);

// Get all forecasts
router.get('/all', forecastController.getAll);

export default router;
