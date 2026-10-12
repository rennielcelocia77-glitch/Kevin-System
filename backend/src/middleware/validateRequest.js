import { validationResult } from 'express-validator';
import { failure } from '../utils/apiResponse.js';

export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return failure(res, 'Request validation failed', 'VALIDATION_ERROR', 422);
  return next();
}
