import express from 'express';
import { body, query } from 'express-validator';
import goalController from '../controllers/goalController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * Goal routes
 * All routes require authentication
 */
router.use(authenticate);

// Create goal
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(['spending_cap', 'savings_target', 'category_limit', 'custom']),
    body('targetValue').isFloat({ min: 0 }),
    body('period').isIn(['daily', 'weekly', 'monthly', 'yearly']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('description').optional().trim(),
  ],
  validate,
  goalController.create
);

// Get all goals
router.get(
  '/',
  [
    query('status').optional().isIn(['active', 'completed', 'failed', 'paused']),
    query('source').optional().isIn(['user', 'ai_recommended']),
  ],
  validate,
  goalController.getAll
);

// Get goal by ID
router.get('/:id', goalController.getById);

// Update goal
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('targetValue').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'completed', 'failed', 'paused']),
    body('description').optional().trim(),
  ],
  validate,
  goalController.update
);

// Delete goal
router.delete('/:id', goalController.delete);

// Generate AI recommendations
router.post('/generate-recommendations', goalController.generateRecommendations);

// Update goal progress
router.post('/:id/update-progress', goalController.updateProgress);

export default router;
