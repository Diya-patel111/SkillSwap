const logger = require('../config/logger');

/**
 * Global error handler — must be registered last via app.use()
 *
 * Logs full context (method, path, requestId, stack) via winston.
 * Sanitises 500 responses in production so stack traces never reach clients.
 */
const errorHandler = (err, req, res, _next) => {
  const requestId = req.requestId || 'n/a';
  const meta = {
    requestId,
    method:  req.method,
    path:    req.originalUrl,
    status:  err.statusCode || 500,
    err:     err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  if ((err.statusCode || 500) >= 500) {
    logger.error('Unhandled server error', meta);
  } else {
    logger.warn('Request error', meta);
  }

  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose CastError (invalid ObjectId) ──────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose ValidationError ───────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(statusCode).json({ message: 'Validation failed', errors, requestId });
  }

  // ── Mongoose duplicate key (code 11000) ────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `${field} already exists`, requestId });
  }

  // ── JWT errors ─────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token', requestId });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired', requestId });
  }

  // ── Multer file size error ─────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size exceeds the allowed limit', requestId });
  }

  // Don't leak internal details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({ message, requestId });
};

module.exports = { errorHandler };
