const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Combines a list of express-validator chains and short-circuits the request
 * with a 422 + field level details when any rule fails.
 *
 * Usage: router.post('/x', validate([body('name').notEmpty()]), handler)
 */
const validate = (chains = []) => [
  ...chains,
  (req, _res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(ApiError.unprocessable('Validation failed', details));
  },
];

module.exports = validate;
