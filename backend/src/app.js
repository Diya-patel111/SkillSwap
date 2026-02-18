require('dotenv').config();

// Validate env vars and build typed config — import early so everything else can use it
const config = require('./config/env');
const logger = require('./config/logger');

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
// Passport must be required here so the Google Strategy is registered
const passport     = require('./config/passport');

const connectDB      = require('./config/db');
const authRoutes      = require('./routes/auth.routes');
const userRoutes      = require('./routes/users.routes');
const swapRoutes      = require('./routes/swaps.routes');
const skillsRoutes    = require('./routes/skills.routes');
const reviewsRoutes   = require('./routes/reviews.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const messagesRoutes  = require('./routes/messages.routes');
const sessionsRoutes      = require('./routes/sessions.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const { errorHandler }  = require('./middleware/error.middleware');
const { requestId }     = require('./middleware/requestId.middleware');

// ── Connect to MongoDB Atlas ────────────────────────────
connectDB();

const app = express();

// ── Trust proxy (required when behind Nginx / Heroku / Railway / Render) ───
// Ensures rate-limiter sees the real client IP from X-Forwarded-For,
// and req.protocol returns 'https' correctly.
app.set('trust proxy', 1);

// ── Request ID — attach before any logging ──────────────
app.use(requestId);

// ── Gzip compression (skip for already-compressed types) ────────────────────
app.use(compression({
  // Only compress responses larger than 1 KB
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ── Security headers (helmet) ────────────────────────────
app.use(
  helmet({
    // Content-Security-Policy — tightened for a pure-API server
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'none'"],
        scriptSrc:      ["'none'"],
        styleSrc:       ["'none'"],
        imgSrc:         ["'none'"],
        connectSrc:     ["'self'"],
        fontSrc:        ["'none'"],
        objectSrc:      ["'none'"],
        mediaSrc:       ["'none'"],
        frameSrc:       ["'none'"],
        formAction:     ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.isProd ? [] : null,
      },
    },
    // Hide the X-Powered-By header
    hidePoweredBy: true,
    // Prevent MIME-type sniffing
    noSniff: true,
    // Enable XSS filter in older browsers
    xssFilter: true,
    // Strict-Transport-Security (HSTS) — only enable in production over HTTPS
    hsts: config.isProd
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    // Prevent click-jacking
    frameguard: { action: 'deny' },
    // Referrer-Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Cross-Origin policies
    crossOriginEmbedderPolicy:  false,  // relax for avatar image serving
    crossOriginOpenerPolicy:    { policy: 'same-origin' },
    crossOriginResourcePolicy:  { policy: 'cross-origin' },  // allow avatar CDN loads
  }),
);

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = new Set(config.cors.origins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) and whitelisted origins
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS rejected origin', { origin });
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Skip-Loading'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86_400,   // pre-flight cache for 24 h
  }),
);

// ── HTTP access logger ───────────────────────────────────
if (config.env !== 'test') {
  app.use(
    morgan(config.isProd ? 'combined' : 'dev', {
      stream: logger.stream,
      // Skip health-check noise in production
      skip: (req) => config.isProd && req.url === '/api/health',
    }),
  );
}

// ── Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Static files — serve uploaded profile images ─────────
app.use('/uploads', express.static('uploads'));

// ── Passport (stateless – no sessions) ───────────────────
app.use(passport.initialize());

// ── Global rate limiter ───────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req) => req.ip,
  message: { message: 'Too many requests — please try again later.' },
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.originalUrl });
    res.status(options.statusCode).json(options.message);
  },
});
app.use('/api', globalLimiter);

// ── Stricter limiter for auth endpoints ───────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many authentication attempts — please try again in 15 minutes.' },
});
app.use('/api/auth', authLimiter);

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/swaps',     swapRoutes);
app.use('/api/skills',    skillsRoutes);
app.use('/api/reviews',   reviewsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages',  messagesRoutes);
app.use('/api/sessions',       sessionsRoutes);
app.use('/api/notifications',  notificationsRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() }),
);

// ── 404 for unmapped routes ───────────────────────────────
app.use((req, res) =>
  res.status(404).json({ message: 'Route not found', requestId: req.requestId }),
);

// ── Global error handler ──────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`SkillSwap API started`, { port: PORT, env: config.env });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Kill the other process and restart.`);
    process.exit(1);
  } else {
    throw err;
  }
});

module.exports = app;

