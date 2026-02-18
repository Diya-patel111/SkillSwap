/**
 * env.js — Environment variable validator
 *
 * Validates that all required variables are present at startup.
 * Fails fast in production; warns in development.
 * Exports a typed `config` object so the rest of the app never reads
 * process.env directly (easier to mock in tests).
 */

const REQUIRED = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_ORIGIN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  const msg = `[env] Missing required environment variables:\n  ${missing.join('\n  ')}`;
  if (process.env.NODE_ENV === 'production') {
    console.error(msg);
    process.exit(1);
  } else {
    console.warn(`⚠️  ${msg}`);
  }
}

const config = {
  env:  process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  isProd: process.env.NODE_ENV === 'production',

  mongo: {
    uri: process.env.MONGO_URI || '',
  },

  jwt: {
    secret:              process.env.JWT_SECRET || '',
    refreshSecret:       process.env.JWT_REFRESH_SECRET || '',
    expiresIn:           process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn:    process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    // Supports comma-separated list: "https://app.com,https://www.app.com"
    origins: (process.env.CLIENT_ORIGIN || 'http://localhost:4200')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  google: {
    clientId:     process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:  process.env.GOOGLE_CALLBACK_URL || '',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  /** Where to write log files (production only). Default: ./logs */
  logDir: process.env.LOG_DIR || 'logs',
};

module.exports = config;
