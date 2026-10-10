const { body } = require('express-validator');
const { isValidPhone } = require('../utils/phone');

const phoneRule = (field = 'phone') =>
  body(field)
    .custom((value) => isValidPhone(value))
    .withMessage('A valid mobile number (10-15 digits) is required');

const strongPasswordRule = (field = 'newPassword') =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number');

const requestOtpRules = [
  phoneRule('phone'),
  body('purpose').optional().isIn(['login', 'registration']).withMessage('purpose must be login or registration'),
];

const verifyOtpRules = [
  phoneRule('phone'),
  body('otp').isLength({ min: 4, max: 8 }).withMessage('OTP is required').isNumeric().withMessage('OTP must be numeric'),
];

const passwordLoginRules = [
  phoneRule('phone'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  strongPasswordRule('newPassword'),
  body('currentPassword').optional().isString(),
];

const refreshRules = [body('refreshToken').notEmpty().withMessage('refreshToken is required')];

const fcmTokenRules = [body('token').notEmpty().withMessage('token is required')];

const checkPhoneRules = [
  phoneRule('phone'),
];

module.exports = {
  requestOtpRules,
  verifyOtpRules,
  passwordLoginRules,
  changePasswordRules,
  refreshRules,
  fcmTokenRules,
  checkPhoneRules,
};
