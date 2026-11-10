import { failure } from '../utils/apiResponse.js';

export function errorHandler(error, req, res, next) {
  const status = Number(error.status);
  if (status >= 400 && status < 500) {
    return failure(res, error.message || 'The request could not be completed', error.code || 'REQUEST_FAILED', status);
  }
  console.error(error);
  return failure(res, 'An unexpected server error occurred', 'INTERNAL_SERVER_ERROR', 500);
}
