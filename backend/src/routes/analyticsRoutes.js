import express from 'express';
import { query } from 'express-validator';
import analyticsController from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * Analytics routes
 * All routes require authentication
 */
router.use(authenticate);

// Get monthly summary
router.get(
  '/monthly',
  [
    query('year').isInt({ min: 2000, max: 2100 }),
    query('month').isInt({ min: 1, max: 12 }),
  ],
  validate,
  analyticsController.getMonthlySummary
);

// Get category breakdown
router.get(
  '/category-breakdown',
  [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    query('type').optional().isIn(['income', 'expense']),
  ],
  validate,
  analyticsController.getCategoryBreakdown
);

// Get budget progress
router.get(
  '/budget-progress',
  [
    query('year').isInt({ min: 2000, max: 2100 }),
    query('month').isInt({ min: 1, max: 12 }),
  ],
  validate,
  analyticsController.getBudgetProgress
);

// Get trends
router.get(
  '/trends',
  [query('months').optional().isInt({ min: 1, max: 24 })],
  validate,
  analyticsController.getTrends
);

// Get savings rate
router.get(
  '/savings-rate',
  [
    query('year').isInt({ min: 2000, max: 2100 }),
    query('month').isInt({ min: 1, max: 12 }),
  ],
  validate,
  analyticsController.getSavingsRate
);

export default router;
