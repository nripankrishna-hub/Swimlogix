const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

/**
 * Multi-tenant guard.
 *
 * Every non-superadmin account is permanently bound to one institution: the tenant id is
 * derived from the verified JWT (never from client input) which prevents horizontal privilege
 * escalation between institutions. SuperAdmins may target any institution explicitly.
 */
const resolveTenant = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());

  if (req.user.role === 'superadmin') {
    const requested = req.params.institutionId || req.body.institutionId || req.query.institutionId;
    if (requested) {
      if (!mongoose.isValidObjectId(requested)) return next(ApiError.badRequest('Invalid institutionId'));
      req.institutionId = new mongoose.Types.ObjectId(requested);
    } else {
      req.institutionId = null;
    }
    return next();
  }

  if (!req.user.institutionId) {
    return next(ApiError.forbidden('Your account is not linked to an institution yet', 'NO_INSTITUTION'));
  }

  req.institutionId = req.user.institutionId;
  return next();
};

/** Require that a (superadmin-targeted) institution scope actually resolved. */
const requireInstitution = (req, _res, next) => {
  if (!req.institutionId) {
    return next(ApiError.badRequest('institutionId is required for this operation', undefined, 'INSTITUTION_REQUIRED'));
  }
  return next();
};

/** MongoDB filter helper guaranteeing tenant isolation in every query. */
const tenantFilter = (req, extra = {}) => ({ ...extra, institutionId: req.institutionId });

module.exports = { resolveTenant, requireInstitution, tenantFilter };
