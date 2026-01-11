import logger from './logger.js';

/**
 * Custom error classes for better error handling
 * Provides consistent error responses across the application
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Global error handler middleware
 * Centralizes error handling and logging
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  });

  // Operational errors: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: {
        message: err.message,
        ...(err.errors && { errors: err.errors }),
      },
    });
  }

  // Programming errors: don't leak details
  return res.status(500).json({
    success: false,
    error: {
      message: 'An unexpected error occurred',
    },
  });
};
