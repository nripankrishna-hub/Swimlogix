/**
 * Wraps an async express handler so rejected promises are forwarded to the error middleware
 * instead of crashing the process / hanging the request.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
