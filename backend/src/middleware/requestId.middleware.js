/**
 * requestId.middleware.js — Attaches a unique X-Request-ID to every request.
 *
 * - Reads an incoming X-Request-ID header (set by a gateway/load-balancer)
 *   or generates a new 16-character hex ID.
 * - Sets the same ID on the response so clients / logs can correlate calls.
 * - Attaches req.requestId so downstream middleware and error handlers can
 *   include it in log entries.
 */

const { randomBytes } = require('crypto');

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const requestId = (req, res, next) => {
  const id = (req.headers['x-request-id'] || randomBytes(8).toString('hex')).toString();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

module.exports = { requestId };
