const User = require('../models/User');
const Institution = require('../models/Institution');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { normalizePhone } = require('../utils/phone');
const { verifyRefreshToken } = require('../utils/token');
const otpService = require('../services/otpService');
const { issueTokens, resolveNextStep } = require('../services/authService');

/**
 * POST /api/v1/auth/check-phone
 * Body: { phone } -> Checks phone number existence and returns required auth method based on role.
 */
const checkPhone = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  
  const user = await User.findOne({ phone }).select('role status');
  
  if (!user) {
    // If not found, it means it's a new user (likely a student trying to register)
    return res.status(200).json({
      success: true,
      data: {
        isRegistered: false,
        authMethod: 'otp', // Default flow for new registrations is OTP
      },
    });
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Account suspended. Contact the platform administrator.', 'ACCOUNT_SUSPENDED');
  }

  let authMethod = 'password';
  if (user.role === 'student') {
    authMethod = 'otp';
  }

  res.status(200).json({
    success: true,
    data: {
      isRegistered: true,
      role: user.role,
      authMethod,
    },
  });
});

/**
 * POST /api/v1/auth/otp/request
 * Body: { phone, purpose? }  -> issues an OTP for a Student / family member.
 */
const requestOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const purpose = req.body.purpose === 'registration' ? 'registration' : 'login';

  const existing = await User.findOne({ phone }).select('role');
  if (existing && existing.role !== 'student') {
    throw ApiError.badRequest(
      'This number belongs to an Institution or Platform account. Please login with your password.',
      'USE_PASSWORD_LOGIN',
    );
  }

  const result = await otpService.sendOtp(phone, purpose);
  res.status(200).json({
    success: true,
    data: { phone, purpose, isNewUser: !existing, ...result },
  });
});

/**
 * POST /api/v1/auth/otp/verify
 * Body: { phone, otp } -> verifies the OTP and returns JWT pair + routing hint.
 * A brand new phone number is auto-provisioned as a Student account (status active, unlinked).
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const otp = String(req.body.otp || '').trim();

  await otpService.verifyOtp(phone, otp, 'login');

  let user = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await User.create({
      phone,
      role: 'student',
      name: '',
      status: 'active',
      isPasswordChanged: true, // OTP accounts never carry a password
    });
  } else if (user.role !== 'student') {
    throw ApiError.badRequest('Please login with your password.', 'USE_PASSWORD_LOGIN');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokens(user);
  res.status(200).json({
    success: true,
    data: { ...tokens, nextStep: await resolveNextStep(user), isNewUser },
  });
});

/**
 * POST /api/v1/auth/password/login
 * Body: { phone, password } -> Admin / Moderator / SuperAdmin login.
 */
const passwordLogin = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const { password } = req.body;

  const user = await User.findOne({ phone }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid mobile number or password', 'INVALID_CREDENTIALS');

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Account suspended. Contact the platform administrator.', 'ACCOUNT_SUSPENDED');
  }

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid mobile number or password', 'INVALID_CREDENTIALS');

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokens(user);
  res.status(200).json({
    success: true,
    data: {
      ...tokens,
      nextStep: await resolveNextStep(user),
      mustChangePassword: !!(user.mustChangePassword && !user.isPasswordChanged),
    },
  });
});

/**
 * POST /api/v1/auth/change-password   (protected)
 * Body: { newPassword, currentPassword? }
 * Mandatory on first Admin/Moderator login (temporary password).
 */
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  const { newPassword, currentPassword } = req.body;

  if (user.passwordHash && !user.mustChangePassword) {
    if (!currentPassword) throw ApiError.badRequest('Current password is required');
    const ok = await user.comparePassword(currentPassword);
    if (!ok) throw ApiError.unauthorized('Current password is incorrect', 'INVALID_CREDENTIALS');
  }

  if (currentPassword && currentPassword === newPassword) {
    throw ApiError.badRequest('New password must be different from the current password');
  }

  await user.setPassword(newPassword);
  user.isPasswordChanged = true;
  user.mustChangePassword = false;
  await user.save();

  res.status(200).json({
    success: true,
    data: { user: user.toSafeJSON(), nextStep: await resolveNextStep(user) },
    message: 'Password updated successfully',
  });
});

/**
 * GET /api/v1/auth/me   (protected)
 * Returns the authenticated user plus their role-specific context.
 */
const me = asyncHandler(async (req, res) => {
  const user = req.user;
  const payload = { user: user.toSafeJSON() };

  if (user.institutionId) {
    payload.institution = await Institution.findById(user.institutionId);
  }

  if (user.role === 'student') {
    payload.studentProfile = await StudentProfile.findOne({ userId: user._id }).populate(
      'batchId',
      'name timing days level',
    );
  }

  payload.nextStep = await resolveNextStep(user);
  res.status(200).json({ success: true, data: payload });
});

/**
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('refreshToken is required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_INVALID');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status === 'suspended') throw ApiError.unauthorized('Session no longer valid');

  res.status(200).json({ success: true, data: issueTokens(user) });
});

/**
 * POST /api/v1/auth/fcm-token   (protected)
 * Body: { token }  -> registers a device for push notifications.
 */
const registerFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = req.user;
  user.fcmTokens = [token, ...(user.fcmTokens || []).filter((t) => t !== token)].slice(0, 10);
  await user.save();
  res.status(200).json({ success: true, message: 'Device registered for notifications' });
});

/** DELETE /api/v1/auth/fcm-token?token=...  (protected) */
const removeFcmToken = asyncHandler(async (req, res) => {
  const token = req.query.token || req.body.token;
  const user = req.user;
  user.fcmTokens = (user.fcmTokens || []).filter((t) => t !== token);
  await user.save();
  res.status(200).json({ success: true, message: 'Device unregistered' });
});

module.exports = {
  checkPhone,
  requestOtp,
  verifyOtp,
  passwordLogin,
  changePassword,
  me,
  refresh,
  registerFcmToken,
  removeFcmToken,
};

