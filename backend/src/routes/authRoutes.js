import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * Authentication routes
 * Handles user registration, login, token refresh, and profile management
 */

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('monthlyIncome').optional().isFloat({ min: 0 }),
    body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']),
  ],
  validate,
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  authController.refreshToken
);

// Logout (requires authentication)
router.post(
  '/logout',
  authenticate,
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  authController.logout
);

// Get profile (requires authentication)
router.get('/profile', authenticate, authController.getProfile);

// Update profile (requires authentication)
router.put(
  '/profile',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('monthlyIncome').optional().isFloat({ min: 0 }),
    body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']),
    body('budgetPreferences.savingsTarget').optional().isInt({ min: 0, max: 100 }),
    body('budgetPreferences.alertThreshold').optional().isInt({ min: 0, max: 100 }),
  ],
  validate,
  authController.updateProfile
);

export default router;
