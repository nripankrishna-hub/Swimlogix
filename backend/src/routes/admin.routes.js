const express = require('express');
const profile = require('../controllers/adminProfileController');
const batches = require('../controllers/adminBatchController');
const students = require('../controllers/adminStudentController');
const moderators = require('../controllers/adminModeratorController');
const notifications = require('../controllers/adminNotificationController');
const monitoring = require('../controllers/adminMonitoringController');
const validate = require('../middleware/validate');
const { authenticate, authorize, enforceTemporaryPassword } = require('../middleware/auth');
const { resolveTenant, requireInstitution } = require('../middleware/tenant');
const { upload } = require('../middleware/upload');
const v = require('../validators/adminValidators');

const router = express.Router();

// Admin portal: JWT + role + tenant scope + mandatory temp-password change.
router.use(authenticate, authorize('admin'), resolveTenant, requireInstitution, enforceTemporaryPassword);

/* ----------------------------- Institution profile ----------------------------- */
router.get('/profile', profile.getProfile);
router.put('/profile', validate(v.profileSetupRules), profile.setupProfile);
router.post('/profile/logo', upload.single('logo'), profile.uploadLogo);
router.get('/registration-fields', profile.getRegistrationFields);
router.put('/registration-fields', validate(v.registrationFieldsRules), profile.updateRegistrationFields);
router.patch('/settings/pin-mode', validate(v.pinModeRules), profile.updatePinMode);

/* ---------------------------------- Batches ----------------------------------- */
router.post('/batches', validate(v.createBatchRules), batches.createBatch);
router.get('/batches', batches.listBatches);
router.get('/batches/:batchId', batches.getBatch);
router.patch('/batches/:batchId', validate(v.updateBatchRules), batches.updateBatch);
router.delete('/batches/:batchId', batches.deleteBatch);
router.patch('/batches/:batchId/coach', batches.assignCoach);

/* --------------------------- Students & approvals ----------------------------- */
router.get('/students', students.listStudents);
router.get('/students/pending', students.listPendingStudents);
router.get('/students/:studentId', students.getStudent);
router.patch('/students/:studentId/approve', validate(v.approveStudentRules), students.approveStudent);
router.patch('/students/:studentId/reject', validate(v.rejectRules), students.rejectStudent);
router.post('/students/:studentId/assign-pin', validate(v.assignPinRules), students.assignPin);
router.patch('/students/:studentId/batch', validate(v.assignBatchRules), students.assignBatch);
router.patch('/students/:studentId/fees', validate(v.feeStatusRules), students.updateFeeStatus);
router.delete('/students/:studentId', students.deleteStudent);
router.post('/students/enroll', students.enrollStudent);

/* --------------------------------- Moderators --------------------------------- */
router.post('/moderators', validate(v.createModeratorRules), moderators.createModerator);
router.get('/moderators', moderators.listModerators);
router.patch('/moderators/:userId', moderators.updateModerator);
router.post('/moderators/:userId/reset-password', moderators.resetModeratorPassword);
router.delete('/moderators/:userId', moderators.removeModerator);
router.delete('/moderators/:userId/hard', moderators.hardDeleteModerator);
router.delete('/moderators/:userId/true-delete', moderators.trueDeleteModerator);
router.post('/moderators/promote', moderators.promoteStudent);

/* ------------------------------ Communication hub ----------------------------- */
router.post('/notifications', validate(v.notificationRules), notifications.sendNotification);
router.get('/notifications', notifications.listNotifications);

/* --------------------------------- Monitoring --------------------------------- */
router.get('/dashboard', monitoring.dashboard);
router.get('/monitoring/attendance', monitoring.attendanceLogs);
router.get('/monitoring/attendance/export', monitoring.exportAttendanceCsv);
router.post('/monitoring/backfill-absences', monitoring.backfillAbsences);
router.get('/monitoring/swim-tests', monitoring.swimTestResults);
router.get('/monitoring/students/:studentId/progress', monitoring.studentProgress);

module.exports = router;
