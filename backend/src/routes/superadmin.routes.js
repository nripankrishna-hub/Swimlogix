const express = require('express');
const controller = require('../controllers/superadminController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createInstitutionRules,
  addAdminRules,
  updateInstitutionRules,
  setUserStatusRules,
} = require('../validators/superadminValidators');

const router = express.Router();

// Every route below requires a SuperAdmin (developer portal) token.
router.use(authenticate, authorize('superadmin'));

/**
 * @route  GET /api/v1/superadmin/stats
 * @desc   Platform KPIs, license expirations and usage counters
 */
router.get('/stats', controller.platformStats);

/**
 * @route  POST /api/v1/superadmin/institutions
 * @desc   Register an institution + its first Admin (returns one-time temp password)
 */
router.post('/institutions', validate(createInstitutionRules), controller.createInstitution);

/**
 * @route  GET /api/v1/superadmin/institutions
 * @desc   Paginated institution directory with subscription + usage info
 */
router.get('/institutions', controller.listInstitutions);

/**
 * @route  GET /api/v1/superadmin/institutions/:institutionId
 */
router.get('/institutions/:institutionId', controller.getInstitution);

/**
 * @route  PATCH /api/v1/superadmin/institutions/:institutionId
 * @desc   Update subscription validity, limits, contact or status
 */
router.patch('/institutions/:institutionId', validate(updateInstitutionRules), controller.updateInstitution);

/**
 * @route  POST /api/v1/superadmin/institutions/:institutionId/admins
 * @desc   Create an additional Admin for an institution
 */
router.post('/institutions/:institutionId/admins', validate(addAdminRules), controller.addAdmin);

/**
 * @route  POST /api/v1/superadmin/admins/:userId/reset-password
 * @desc   Regenerate a temporary password for an Admin/Moderator
 */
router.post('/admins/:userId/reset-password', controller.resetAdminPassword);

/**
 * @route  PATCH /api/v1/superadmin/users/:userId/status
 * @desc   Suspend / activate any non-superadmin account
 */
router.patch('/users/:userId/status', validate(setUserStatusRules), controller.setUserStatus);

module.exports = router;
