const express = require('express');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit');
const {
  requestOtpRules,
  verifyOtpRules,
  passwordLoginRules,
  changePasswordRules,
  refreshRules,
  fcmTokenRules,
  checkPhoneRules,
} = require('../validators/authValidators');

const router = express.Router();


/**
 * @route  POST /api/v1/auth/check-phone
 * @desc   Check phone number and determine auth method
 * @access Public
 */
router.post('/check-phone', authLimiter, validate(checkPhoneRules), controller.checkPhone);

/**
 * @route  POST /api/v1/auth/otp/request
 * @desc   Request an OTP for Student / family-member login (mockable SMS provider)
 * @access Public
 */
router.post('/otp/request', otpLimiter, validate(requestOtpRules), controller.requestOtp);

/**
 * @route  POST /api/v1/auth/otp/verify
 * @desc   Verify OTP -> JWT pair + role routing hint (nextStep)
 * @access Public
 */
router.post('/otp/verify', authLimiter, validate(verifyOtpRules), controller.verifyOtp);

/**
 * @route  POST /api/v1/auth/password/login
 * @desc   Mobile number + password login for Admin, Moderator and SuperAdmin
 * @access Public
 */
router.post('/password/login', authLimiter, validate(passwordLoginRules), controller.passwordLogin);

/**
 * @route  POST /api/v1/auth/refresh
 * @desc   Exchange a refresh token for a new access token
 * @access Public
 */
router.post('/refresh', validate(refreshRules), controller.refresh);

/**
 * @route  GET /api/v1/auth/me
 * @desc   Current user + institution + student profile context
 * @access Private
 */
router.get('/me', authenticate, controller.me);

/**
 * @route  POST /api/v1/auth/change-password
 * @desc   Set a permanent password (mandatory after temporary-password login)
 * @access Private
 */
router.post('/change-password', authenticate, validate(changePasswordRules), controller.changePassword);

/**
 * @route  POST /api/v1/auth/fcm-token
 * @desc   Register the device for push notifications
 * @access Private
 */
router.post('/fcm-token', authenticate, validate(fcmTokenRules), controller.registerFcmToken);

/**
 * @route  DELETE /api/v1/auth/fcm-token
 * @desc   Unregister a device (used on logout)
 * @access Private
 */
router.delete('/fcm-token', authenticate, controller.removeFcmToken);

module.exports = router;
