const { body, param } = require('express-validator');

const markByPinRules = [
  body('batchId').optional({ values: 'falsy' }).isMongoId().withMessage('batchId must be valid if provided'),
  body('pin').matches(/^\d{4}$/).withMessage('PIN must be a 4-digit number'),
  body('status').optional().isIn(['present', 'absent', 'late']),
  body('date').optional({ values: 'falsy' }).isISO8601(),
];

const markSessionRules = [
  body('batchId').isMongoId().withMessage('batchId is required'),
  body('date').optional({ values: 'falsy' }).isISO8601(),
  body('records').isArray({ min: 1 }).withMessage('records[] cannot be empty'),
  body('records.*.studentId').isMongoId().withMessage('Each record needs a valid studentId'),
  body('records.*.status').isIn(['present', 'absent', 'late']).withMessage('Invalid attendance status'),
];

const swimTestRules = [
  body('studentId').isMongoId().withMessage('studentId is required'),
  body('batchId').optional({ values: 'null' }).isMongoId(),
  body('testName').trim().notEmpty().withMessage('Test name is required'),
  body('marks').isFloat({ min: 0 }).withMessage('marks must be a positive number'),
  body('maxMarks').optional().isFloat({ min: 1 }),
  body('result').optional().isIn(['pass', 'fail', 'pending']),
  body('testDate').optional({ values: 'falsy' }).isISO8601(),
];

const milestoneRules = [
  param('studentId').isMongoId(),
  body('title').trim().notEmpty().withMessage('Milestone title is required'),
  body('status').optional().isIn(['pending', 'in-progress', 'achieved']),
];

const announcementRules = [
  body('batchId').isMongoId().withMessage('batchId is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Message body is required'),
];

module.exports = { markByPinRules, markSessionRules, swimTestRules, milestoneRules, announcementRules };
