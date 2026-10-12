import { failure } from '../utils/apiResponse.js';

export function errorHandler(error, req, res, next) {
  console.error(error);
  return failure(res, 'An unexpected server error occurred', 'INTERNAL_SERVER_ERROR', 500);
}
