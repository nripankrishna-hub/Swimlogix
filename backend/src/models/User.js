const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const { Schema } = mongoose;

const ROLES = ['superadmin', 'admin', 'moderator', 'student'];

const UserSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },

    // Primary login identifier for every role (unicity is global so OTP lookup is unambiguous).
    phone: { type: String, required: true, trim: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, default: '' },

    passwordHash: { type: String, select: false },
    role: { type: String, enum: ROLES, required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', default: null, index: true },

    // Temp-password lifecycle: admin/moderator must change the generated password on first login.
    isPasswordChanged: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },

    status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    fcmTokens: [{ type: String }],
    lastLoginAt: { type: Date, default: null },
    profilePhotoUrl: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Fast tenant + role scoped queries (e.g. "list moderators of institution X").
UserSchema.index({ institutionId: 1, role: 1, status: 1 });

UserSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, env.bcryptRounds);
  return this.passwordHash;
};

UserSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    email: this.email,
    role: this.role,
    institutionId: this.institutionId,
    isPasswordChanged: this.isPasswordChanged,
    mustChangePassword: this.mustChangePassword,
    status: this.status,
    profilePhotoUrl: this.profilePhotoUrl,
    createdAt: this.createdAt,
  };
};

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.fcmTokens;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
module.exports.ROLES = ROLES;
