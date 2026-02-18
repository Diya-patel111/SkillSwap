const mongoose = require('mongoose');
const config   = require('./env');
const logger   = require('./logger');

const connectDB = async () => {
  try {
    const opts = {
      // Connection pool
      maxPoolSize: config.isProd ? 20 : 10,
      minPoolSize: config.isProd ? 5  : 1,

      // Timeouts
      serverSelectionTimeoutMS: 10_000,  // give up finding a server after 10 s
      connectTimeoutMS:         10_000,  // initial TCP connect timeout
      socketTimeoutMS:          45_000,  // how long to wait for a response

      // Reliability
      heartbeatFrequencyMS:     10_000,  // how often the driver pings the server
      retryWrites:  true,
      retryReads:   true,

      // Atlas-recommended write concern
      w:       'majority',
      wtimeoutMS: 5_000,

      // Prefer nearest replica in production for lower latency reads
      readPreference: config.isProd ? 'nearest' : 'primary',

      // Compression
      compressors: 'zlib',
    };

    const conn = await mongoose.connect(config.mongo.uri, opts);
    logger.info('MongoDB Atlas connected', { host: conn.connection.host });

    // ── Connection lifecycle events ────────────────────────────────────
    mongoose.connection.on('disconnected', () =>
      logger.warn('MongoDB disconnected — driver will auto-reconnect'),
    );
    mongoose.connection.on('reconnected', () =>
      logger.info('MongoDB reconnected'),
    );
    mongoose.connection.on('error', (err) =>
      logger.error('MongoDB connection error', { err: err.message }),
    );

    // ── Graceful shutdown ──────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — closing MongoDB connection`);
      await mongoose.connection.close();
      process.exit(0);
    };
    process.once('SIGINT',  () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    logger.error('MongoDB connection failed — exiting', { err: err.message });
    process.exit(1);
  }
};

module.exports = connectDB;
