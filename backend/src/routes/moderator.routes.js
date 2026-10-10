const express = require('express');
const controller = require('../controllers/moderatorController');
const validate = require('../middleware/validate');
const { authenticate, authorize, enforceTemporaryPassword } = require('../middleware/auth');
const { resolveTenant, requireInstitution } = require('../middleware/tenant');
const v = require('../validators/moderatorValidators');

const router = express.Router();

// Operations portal: Moderator only (Admins can reuse read-only endpoints if needed).
router.use(authenticate, authorize('moderator', 'admin'), resolveTenant, requireInstitution, enforceTemporaryPassword);

/* ------------------------------- Batches / home ------------------------------- */
router.get('/batches', controller.myBatches);
router.get('/dashboard', controller.dashboard);

/* --------------------------------- Attendance --------------------------------- */
router.get('/attendance/session', controller.getSession);
router.get('/attendance/pin/:pin', controller.getStudentByPin);
router.post('/attendance/pin', validate(v.markByPinRules), controller.markAttendanceByPin);
router.post('/attendance/session', validate(v.markSessionRules), controller.markAttendanceSession);

/* --------------------------------- Swim tests --------------------------------- */
router.post('/swim-tests', validate(v.swimTestRules), controller.createSwimTest);
router.get('/swim-tests', controller.listSwimTests);
router.patch('/swim-tests/:testId', controller.updateSwimTest);

/* ---------------------------- Progress & announcements ------------------------ */
router.get('/students/:studentId/progress', controller.studentProgress);
router.post('/students/:studentId/milestones', validate(v.milestoneRules), controller.addMilestone);
router.post('/announcements', validate(v.announcementRules), controller.sendAnnouncement);

module.exports = router;
