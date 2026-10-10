const { body, param } = require('express-validator');
const { isValidPhone } = require('../utils/phone');

const profileSetupRules = [
  body('name').optional().trim().notEmpty().withMessage('Institution name cannot be empty'),
  body('contact.email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
  body('feeStructure').optional().isArray().withMessage('feeStructure must be an array'),
  body('feeStructure.*.name').optional().trim().notEmpty().withMessage('Fee name is required'),
  body('feeStructure.*.amount').optional().isFloat({ min: 0 }).withMessage('Fee amount must be >= 0'),
];

const registrationFieldsRules = [
  body('fields').isArray({ min: 1 }).withMessage('Provide at least one registration field'),
  body('fields.*.key').trim().notEmpty().withMessage('Each field needs a key'),
  body('fields.*.label').trim().notEmpty().withMessage('Each field needs a label'),
  body('fields.*.type')
    .isIn(['text', 'number', 'email', 'phone', 'date', 'select', 'boolean', 'textarea', 'file'])
    .withMessage('Unsupported field type'),
];

const pinModeRules = [body('pinMode').isIn(['auto', 'sequential']).withMessage('pinMode must be auto or sequential')];

const createBatchRules = [
  body('name').trim().notEmpty().withMessage('Batch name is required'),
  body('days').optional().isArray(),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'competitive', 'adult']).withMessage('Invalid level'),
  body('capacity').optional().isInt({ min: 1, max: 500 }),
  body('feeAmount').optional().isFloat({ min: 0 }),
  body('isFree').optional().isBoolean(),
  body('coachId').optional({ values: 'null' }).isMongoId().withMessage('coachId must be a valid id'),
];

const updateBatchRules = [
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'competitive', 'adult']),
  body('status').optional().isIn(['active', 'inactive', 'completed']),
  body('feeAmount').optional().isFloat({ min: 0 }),
  body('isFree').optional().isBoolean(),
  body('coachId').optional({ values: 'null' }).isMongoId(),
];

const createModeratorRules = [
  body('name').trim().notEmpty().withMessage('Moderator name is required'),
  body('phone').custom((v) => isValidPhone(v)).withMessage('Valid moderator mobile number is required'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mustChangePassword').optional().isBoolean(),
];

const approveStudentRules = [
  param('studentId').isMongoId().withMessage('Invalid student id'),
  body('pin').optional({ values: 'null' }).matches(/^[1-9]\d{3}$/).withMessage('PIN must be a 4-digit number between 1000-9999'),
  body('batchId').optional({ values: 'null' }).isMongoId().withMessage('batchId must be a valid id'),
];

const assignPinRules = [
  param('studentId').isMongoId(),
  body('pin').optional({ values: 'null' }).matches(/^[1-9]\d{3}$/).withMessage('PIN must be a 4-digit number between 1000-9999'),
];

const assignBatchRules = [
  param('studentId').isMongoId(),
  body('batchId').optional({ values: 'null' }).isMongoId().withMessage('batchId must be a valid id'),
];

const feeStatusRules = [
  param('studentId').isMongoId(),
  body('feeStatus').isIn(['paid', 'pending', 'partial', 'overdue']).withMessage('Invalid feeStatus'),
  body('feeDueAmount').optional().isFloat({ min: 0 }),
];

const notificationRules = [
  body('targetAudience').isIn(['all', 'batch', 'student']).withMessage('targetAudience must be all, batch or student'),
  body('batchId').optional({ values: 'null' }).isMongoId(),
  body('studentId').optional({ values: 'null' }).isMongoId(),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 160 }),
  body('body').trim().notEmpty().withMessage('Message body is required').isLength({ max: 2000 }),
];

const rejectRules = [
  param('studentId').isMongoId(),
  body('reason').optional().trim().isLength({ max: 500 }),
];

module.exports = {
  profileSetupRules,
  registrationFieldsRules,
  pinModeRules,
  createBatchRules,
  updateBatchRules,
  createModeratorRules,
  approveStudentRules,
  assignPinRules,
  assignBatchRules,
  feeStatusRules,
  notificationRules,
  rejectRules,
};
