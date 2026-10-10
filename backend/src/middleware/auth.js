const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');

/**
 * Verify the Bearer access token, hydrate `req.user` and reject suspended accounts.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) throw ApiError.unauthorized('Authentication token missing');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Session expired, please login again'
      : 'Invalid authentication token';
    throw ApiError.unauthorized(message, err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Account suspended. Contact your institution administrator.', 'ACCOUNT_SUSPENDED');
  }

  req.user = user;
  req.auth = payload;
  return next();
});

/**
 * Role Based Access Control. Usage: `authorize('admin', 'moderator')`
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (roles.length && !roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`This action requires one of: ${roles.join(', ')}`));
  }
  return next();
};

/**
 * Force Admins/Moderators created with a temporary password to change it before
 * touching any other endpoint. Students authenticate via OTP and are exempt.
 * Returns 428 Precondition Required + code so the mobile app can route to the change-password screen.
 */
const enforceTemporaryPassword = (req, _res, next) => {
  const { user } = req;
  if (!user) return next(ApiError.unauthorized());
  const isPrivileged = user.role === 'admin' || user.role === 'moderator';
  if (isPrivileged && user.mustChangePassword && !user.isPasswordChanged) {
    return next(
      new ApiError(428, 'You must change your temporary password before continuing', undefined, 'PASSWORD_CHANGE_REQUIRED'),
    );
  }
  return next();
};

module.exports = { authenticate, authorize, enforceTemporaryPassword };
