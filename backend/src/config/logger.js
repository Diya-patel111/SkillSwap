/**
 * logger.js — Winston structured logger
 *
 * Development : colourised, human-readable text to console
 * Production  : JSON to console (for log aggregators like Datadog / CloudWatch)
 *               + separate error.log and combined.log files under LOG_DIR
 *
 * Usage:
 *   const logger = require('./config/logger');
 *   logger.info('Server started', { port: 3000 });
 *   logger.error('DB failed', { err: err.message });
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs   = require('fs');
const config = require('./env');

// ── Ensure log directory exists (production only) ──────────────────────────
const LOG_DIR = config.logDir;
if (config.isProd) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ── Common format pipeline ─────────────────────────────────────────────────
const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  format.errors({ stack: true }),        // include stack on Error objects
  format.splat(),                        // enable printf-style %s substitution
);

// ── Transport: human-readable for development ──────────────────────────────
const devConsole = new transports.Console({
  format: format.combine(
    baseFormat,
    format.colorize({ all: true }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const extras = Object.keys(meta).length
        ? ` ${JSON.stringify(meta, null, 0)}`
        : '';
      return `${timestamp} [${level}] ${message}${extras}`;
    }),
  ),
});

// ── Transport: JSON lines for production (stdout captured by host) ─────────
const prodConsole = new transports.Console({
  format: format.combine(baseFormat, format.json()),
});

// ── File transports (production) ───────────────────────────────────────────
const fileTransports = config.isProd
  ? [
      new transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024,  // 10 MB
        maxFiles: 5,
        tailable: true,
        format: format.combine(baseFormat, format.json()),
      }),
      new transports.File({
        filename: path.join(LOG_DIR, 'combined.log'),
        maxsize: 20 * 1024 * 1024,  // 20 MB
        maxFiles: 7,
        tailable: true,
        format: format.combine(baseFormat, format.json()),
      }),
    ]
  : [];

// ── Build logger ───────────────────────────────────────────────────────────
const logger = createLogger({
  level: config.isProd ? 'info' : 'debug',
  defaultMeta: { service: 'skillswap-api', env: config.env },
  transports: [
    config.isProd ? prodConsole : devConsole,
    ...fileTransports,
  ],
  // Don't exit on handled exceptions — let our error middleware decide
  exitOnError: false,
});

// ── Morgan stream adapter ──────────────────────────────────────────────────
// Usage: morgan('combined', { stream: logger.stream })
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
