const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();

// --- Security & platform middleware -------------------------------------------------
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',') }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Locally stored uploads (used when Cloudinary is not configured).
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// --- Health check -------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', env: env.nodeEnv, uptime: process.uptime() } });
});

// --- API ----------------------------------------------------------------------------
app.use('/api/v1', apiLimiter, routes);

// --- 404 + central error formatter --------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
