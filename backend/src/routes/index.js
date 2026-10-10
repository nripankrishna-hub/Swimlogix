const express = require('express');

const router = express.Router();

/** GET /api/v1 - simple discovery document for the mobile client. */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'SwimLogix API',
      version: 'v1',
      modules: {
        auth: '/api/v1/auth',
        superadmin: '/api/v1/superadmin',
        admin: '/api/v1/admin',
        moderator: '/api/v1/moderator',
        students: '/api/v1/students',
      },
    },
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/superadmin', require('./superadmin.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/moderator', require('./moderator.routes'));
router.use('/students', require('./student.routes'));

module.exports = router;
