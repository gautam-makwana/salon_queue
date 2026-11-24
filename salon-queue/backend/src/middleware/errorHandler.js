// src/middleware/errorHandler.js
// Global Express error handler. Must be registered last.

import { env } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error.'
      : err.message || 'Internal server error.';

  if (status === 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({ error: message });
}

// Wraps async route handlers so errors propagate to errorHandler.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
