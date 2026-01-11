import express from 'express';
import { query } from 'express-validator';
import healthController from '../controllers/healthController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * Health score routes
 * All routes require authentication
 */
router.use(authenticate);

// Compute health score
router.post('/compute', healthController.compute);

// Get latest health score
router.get('/latest', healthController.getLatest);

// Get health score history
router.get(
  '/history',
  [query('limit').optional().isInt({ min: 1, max: 100 })],
  validate,
  healthController.getHistory
);

export default router;
