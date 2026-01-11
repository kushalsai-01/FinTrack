import express from 'express';
import { body, query } from 'express-validator';
import categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * Category routes
 * All routes require authentication
 */
router.use(authenticate);

// Create category
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('type').isIn(['income', 'expense', 'both']).withMessage('Invalid category type'),
    body('monthlyBudget').optional().isFloat({ min: 0 }),
    body('icon').optional().trim(),
    body('color').optional().trim(),
  ],
  validate,
  categoryController.create
);

// Get all categories
router.get(
  '/',
  [
    query('type').optional().isIn(['income', 'expense', 'both']),
    query('isActive').optional().isBoolean(),
  ],
  validate,
  categoryController.getAll
);

// Get category by ID
router.get('/:id', categoryController.getById);

// Update category
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(['income', 'expense', 'both']),
    body('monthlyBudget').optional().isFloat({ min: 0 }),
    body('icon').optional().trim(),
    body('color').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  categoryController.update
);

// Delete category
router.delete('/:id', categoryController.delete);

// Initialize default categories
router.post('/initialize-defaults', categoryController.initializeDefaults);

export default router;
