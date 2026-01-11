import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Validation middleware
 * Checks express-validator results and formats errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    throw new ValidationError('Validation failed', formattedErrors);
  }

  next();
};
