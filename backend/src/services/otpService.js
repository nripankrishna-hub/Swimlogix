const crypto = require('crypto');
const env = require('../config/env');
const Otp = require('../models/Otp');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { generateOtp } = require('../utils/generators');

const hashOtp = (code) => crypto.createHash('sha256').update(`${code}:${env.jwt.secret}`).digest('hex');

/**
 * Pluggable SMS delivery.
 *  - `mock`  : logs to the console (and exposes the OTP in the API response when OTP_DEV_EXPOSE=true)
 *  - `msg91` : sends a real SMS through the MSG91 flow API
 * Swap the provider simply by setting OTP_PROVIDER in the environment.
 */
async function deliver(phone, code, purpose) {
  if (env.otp.provider === 'msg91' && env.otp.msg91.authKey) {
    const url = new URL('https://api.msg91.com/api/v5/otp');
    url.searchParams.set('template_id', env.otp.msg91.templateId);
    url.searchParams.set('mobile', phone);
    url.searchParams.set('authkey', env.otp.msg91.authKey);
    if (env.otp.msg91.senderId) url.searchParams.set('sender', env.otp.msg91.senderId);
    url.searchParams.set('otp', code);

    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      logger.error('MSG91 OTP delivery failed:', response.status, await response.text());
      throw new ApiError(502, 'Unable to send OTP right now, please retry');
    }
    return { provider: 'msg91' };
  }

  // Mock provider
  logger.info(`[OTP:${purpose}] ${phone} -> ${code}`);
  return { provider: 'mock' };
}

/**
 * Issue (or re-issue) an OTP for a phone number. Any previous unconsumed OTP is invalidated.
 */
async function sendOtp(phone, purpose = 'login') {
  const code = generateOtp(env.otp.length);

  await Otp.deleteMany({ phone, purpose, consumed: false });
  const doc = await Otp.create({
    phone,
    purpose,
    otpHash: hashOtp(code),
    expiresAt: new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000),
  });

  const delivery = await deliver(phone, code, purpose);

  return {
    requestId: doc._id,
    expiresInSeconds: env.otp.ttlMinutes * 60,
    provider: delivery.provider,
    ...(env.otp.devExpose ? { devOtp: code } : {}),
  };
}

/**
 * Validate a submitted OTP. Returns true on success (and consumes it), throws ApiError otherwise.
 */
async function verifyOtp(phone, code, purpose = 'login') {
  const record = await Otp.findOne({ phone, purpose, consumed: false }).sort({ createdAt: -1 });

  if (!record) throw ApiError.badRequest('No active OTP found. Please request a new one.', 'OTP_NOT_FOUND');
  if (record.expiresAt.getTime() < Date.now()) throw ApiError.badRequest('OTP expired. Please request a new one.', 'OTP_EXPIRED');
  if (record.attempts >= env.otp.maxAttempts) throw ApiError.tooMany('Too many incorrect attempts. Request a new OTP.', 'OTP_LOCKED');

  record.attempts += 1;
  const matches = record.otpHash === hashOtp(String(code).trim());
  if (!matches) {
    await record.save();
    throw ApiError.badRequest('Incorrect OTP', 'OTP_INVALID');
  }

  record.consumed = true;
  await record.save();
  return true;
}

module.exports = { sendOtp, verifyOtp, hashOtp };
