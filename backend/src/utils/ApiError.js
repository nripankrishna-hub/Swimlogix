/**
 * Operational error carrying an HTTP status code + optional machine-readable code/details.
 * Anything thrown that is not an ApiError is treated as an unexpected 500 by the error handler.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined, code = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details, 'BAD_REQUEST');
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, undefined, code);
  }

  static forbidden(message = 'You do not have permission to perform this action', code = 'FORBIDDEN') {
    return new ApiError(403, message, undefined, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, undefined, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, message, undefined, code);
  }

  static unprocessable(message = 'Validation failed', details, code = 'VALIDATION_ERROR') {
    return new ApiError(422, message, details, code);
  }

  static tooMany(message = 'Too many requests, please try again later', code = 'RATE_LIMITED') {
    return new ApiError(429, message, undefined, code);
  }
}

module.exports = ApiError;
