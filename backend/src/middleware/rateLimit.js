const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const handler = (_req, res) => {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
  });
};

const skipInTest = () => env.isTest;

/** General API limiter. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: skipInTest,
});

/** Strict limiter for credential + OTP endpoints (brute-force protection). */
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: skipInTest,
});

/** Very strict limiter for OTP *requests* (SMS cost protection). */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: skipInTest,
});

module.exports = { apiLimiter, authLimiter, otpLimiter };
