const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const logger = require('../utils/logger');

/** 404 fallback for unmatched routes. */
const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

/** Central error formatter - the single place that shapes API errors. */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Translate common Mongoose / Mongo errors into friendly ApiErrors.
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.unprocessable('Validation failed', details);
  } else if (error instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid value for "${error.path}"`);
  } else if (error && error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`Duplicate value for "${field}". Please use a different one.`, 'DUPLICATE_KEY');
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    error: {
      code: error.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
      message: statusCode === 500 && env.isProd ? 'Something went wrong' : error.message,
    },
  };
  if (error.details) payload.error.details = error.details;

  if (statusCode >= 500) logger.error(`${req.method} ${req.originalUrl} ->`, err);
  else logger.debug(`${req.method} ${req.originalUrl} -> ${statusCode} ${error.message}`);

  res.status(statusCode).json(payload);
};

module.exports = { notFoundHandler, errorHandler };
