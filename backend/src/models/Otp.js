const mongoose = require('mongoose');
const { Schema } = mongoose;

const OtpSchema = new Schema(
  {
    phone: { type: String, required: true, trim: true, index: true },
    purpose: { type: String, enum: ['login', 'registration'], default: 'login' },
    // SHA-256 hash of the OTP - the plaintext code is never persisted.
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Auto-expire OTP documents (MongoDB TTL monitor runs ~every 60s).
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ phone: 1, purpose: 1, consumed: 1 });

module.exports = mongoose.model('Otp', OtpSchema);
