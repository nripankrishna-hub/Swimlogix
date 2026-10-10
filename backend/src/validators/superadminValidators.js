const { body } = require('express-validator');
const { isValidPhone } = require('../utils/phone');

const createInstitutionRules = [
  body('name').trim().notEmpty().withMessage('Institution name is required').isLength({ max: 160 }),
  body('contact.phone').optional().custom((v) => !v || isValidPhone(v)).withMessage('Invalid contact phone'),
  body('contact.email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid contact email'),
  body('subscriptionValidity').optional({ values: 'falsy' }).isISO8601().withMessage('subscriptionValidity must be a date'),
  body('limits.maxStudents').optional().isInt({ min: 1 }).withMessage('maxStudents must be a positive integer'),
  body('limits.maxModerators').optional().isInt({ min: 1 }),
  body('limits.maxBatches').optional().isInt({ min: 1 }),
  body('admin.name').trim().notEmpty().withMessage('Admin name is required'),
  body('admin.phone').custom((v) => isValidPhone(v)).withMessage('Valid Admin mobile number is required'),
];

const addAdminRules = [
  body('name').trim().notEmpty().withMessage('Admin name is required'),
  body('phone').custom((v) => isValidPhone(v)).withMessage('Valid Admin mobile number is required'),
];

const updateInstitutionRules = [
  body('status').optional().isIn(['active', 'suspended', 'expired']).withMessage('Invalid status'),
  body('subscriptionValidity').optional({ values: 'falsy' }).isISO8601().withMessage('subscriptionValidity must be a date'),
];

const setUserStatusRules = [body('status').isIn(['active', 'pending', 'suspended']).withMessage('Invalid status')];

module.exports = { createInstitutionRules, addAdminRules, updateInstitutionRules, setUserStatusRules };
