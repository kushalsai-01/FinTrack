import express from 'express';
import { body, query } from 'express-validator';
import transactionController from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * Transaction routes
 * All routes require authentication
 */
router.use(authenticate);

// Create transaction
router.post(
  '/',
  [
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('category').optional().trim(),
    body('notes').optional().trim(),
    body('paymentMethod').optional().isIn(['cash', 'card', 'bank_transfer', 'digital_wallet', 'other']),
  ],
  validate,
  transactionController.create
);

// Get all transactions with filters
router.get(
  '/',
  [
    query('type').optional().isIn(['income', 'expense']),
    query('category').optional().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  transactionController.getAll
);

// Get transaction by ID
router.get('/:id', transactionController.getById);

// Update transaction
router.put(
  '/:id',
  [
    body('amount').optional().isFloat({ min: 0 }),
    body('description').optional().trim().notEmpty(),
    body('date').optional().isISO8601(),
    body('category').optional().trim(),
    body('notes').optional().trim(),
    body('paymentMethod').optional().isIn(['cash', 'card', 'bank_transfer', 'digital_wallet', 'other']),
  ],
  validate,
  transactionController.update
);

// Delete transaction
router.delete('/:id', transactionController.delete);

// Get monthly summary
router.get(
  '/analytics/monthly',
  [
    query('year').isInt({ min: 2000, max: 2100 }),
    query('month').isInt({ min: 1, max: 12 }),
  ],
  validate,
  transactionController.getMonthlySummary
);

// Get category totals
router.get(
  '/analytics/categories',
  [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    query('type').optional().isIn(['income', 'expense']),
  ],
  validate,
  transactionController.getCategoryTotals
);

export default router;
