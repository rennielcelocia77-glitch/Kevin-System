import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { failure } from '../utils/apiResponse.js';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return failure(res, 'Authentication required', 'UNAUTHENTICATED', 401);
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return failure(res, 'Invalid or expired token', 'INVALID_TOKEN', 401);
  }
}

export function authorize(...roles) {
  return (req, res, next) => roles.includes(req.user?.role)
    ? next()
    : failure(res, 'You are not authorized for this action', 'FORBIDDEN', 403);
}
