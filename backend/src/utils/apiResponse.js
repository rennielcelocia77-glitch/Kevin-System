export function success(res, data, message = 'Request completed successfully', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function failure(res, message, error, status = 400) {
  return res.status(status).json({ success: false, message, error });
}
