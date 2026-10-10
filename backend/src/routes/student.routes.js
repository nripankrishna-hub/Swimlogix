const express = require('express');
const controller = require('../controllers/studentController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const v = require('../validators/studentValidators');

const router = express.Router();

// Member portal: Student / family-member accounts (OTP authenticated).
// NOTE: institution linking happens *before* the tenant is known, so these routes
// read `req.user.institutionId` inside the controllers instead of using resolveTenant.
router.use(authenticate, authorize('student'));

/* -------------------------- Institution linking flow -------------------------- */
router.get('/institution-preview', validate(v.institutionPreviewRules), controller.institutionPreview);
router.post('/link-institution', validate(v.linkInstitutionRules), controller.linkInstitution);
router.patch('/institution', validate(v.linkInstitutionRules), controller.changeInstitution);

/* ------------------------------ Registration form ----------------------------- */
router.get('/registration-form', controller.getRegistrationForm);
router.post('/registration', validate(v.submitRegistrationRules), controller.submitRegistration);

/* --------------------------------- Profile ----------------------------------- */
router.patch('/profile', validate(v.updateProfileRules), controller.updateProfile);
router.post('/family-members', validate(v.familyMemberRules), controller.addFamilyMember);
router.patch('/family-members/:memberId', validate(v.updateFamilyMemberRules), controller.updateFamilyMember);
router.delete('/family-members/:memberId', controller.removeFamilyMember);

/* ------------------------------- Member portal -------------------------------- */
router.get('/dashboard', controller.dashboard);
router.get('/progress', controller.progress);
router.get('/fees', controller.fees);
router.get('/schedule', controller.schedule);

/* --------------------------------- Inbox ------------------------------------- */
router.get('/notifications', controller.listNotifications);
router.post('/notifications/:notificationId/read', controller.markNotificationRead);

module.exports = router;
