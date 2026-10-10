const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Access token payload -> { sub: userId, role, institutionId, type: 'access' }
 */
function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id || user.id),
      role: user.role,
      institutionId: user.institutionId ? String(user.institutionId) : null,
      type: 'access',
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id || user.id), type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn },
  );
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwt.secret);
  if (payload.type !== 'access') throw new Error('Invalid token type');
  return payload;
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwt.refreshSecret);
  if (payload.type !== 'refresh') throw new Error('Invalid token type');
  return payload;
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
