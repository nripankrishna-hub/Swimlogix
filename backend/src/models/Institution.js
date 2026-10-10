const mongoose = require('mongoose');
const { Schema } = mongoose;

const FeeItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    frequency: {
      type: String,
      enum: ['one-time', 'monthly', 'quarterly', 'half-yearly', 'yearly'],
      default: 'monthly',
    },
    description: { type: String, trim: true, default: '' },
  },
  { _id: true },
);

/** Admin-configurable dynamic enrollment form field. */
const RegistrationFieldSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['text', 'number', 'email', 'phone', 'date', 'select', 'boolean', 'textarea', 'file'],
      default: 'text',
    },
    required: { type: Boolean, default: false },
    options: [{ type: String, trim: true }],
    placeholder: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

const AddressSchema = new Schema(
  {
    line1: { type: String, trim: true, default: '' },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    zip: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const InstitutionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    // `code` is generated automatically when the Admin completes profile setup.
    // Sparse unique index => many docs may be null but non-null values are unique.
    code: { type: String, trim: true, uppercase: true, default: null, index: { unique: true, sparse: true } },
    contact: {
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },
    address: { type: AddressSchema, default: () => ({}) },
    policy: { type: String, default: '', maxlength: 10000 },
    logoUrl: { type: String, default: '' },
    logoPublicId: { type: String, default: '' },
    feeStructure: { type: [FeeItemSchema], default: [] },
    registrationFields: { type: [RegistrationFieldSchema], default: [] },
    subscriptionValidity: { type: Date, default: null },

    limits: {
      maxStudents: { type: Number, default: 100, min: 1 },
      maxModerators: { type: Number, default: 10, min: 1 },
      maxBatches: { type: Number, default: 20, min: 1 },
    },

    // PIN assignment strategy for new students.
    pinMode: { type: String, enum: ['auto', 'sequential'], default: 'auto' },
    nextSequentialPin: { type: Number, default: 1000 },

    isProfileComplete: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'suspended', 'expired'], default: 'active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

/** True when the license is present and in the future. */
InstitutionSchema.virtual('isSubscriptionValid').get(function isSubscriptionValid() {
  if (!this.subscriptionValidity) return false;
  return new Date(this.subscriptionValidity).getTime() > Date.now();
});

InstitutionSchema.methods.hasCapacity = async function hasCapacity(kind) {
  const User = mongoose.model('User');
  const Batch = mongoose.model('Batch');
  const StudentProfile = mongoose.model('StudentProfile');
  const institutionId = this._id;
  switch (kind) {
    case 'students': {
      const count = await StudentProfile.countDocuments({ institutionId, approvalStatus: 'approved' });
      return count < this.limits.maxStudents;
    }
    case 'moderators': {
      const count = await User.countDocuments({ institutionId, role: 'moderator' });
      return count < this.limits.maxModerators;
    }
    case 'batches': {
      const count = await Batch.countDocuments({ institutionId });
      return count < this.limits.maxBatches;
    }
    default:
      return false;
  }
};

module.exports = mongoose.model('Institution', InstitutionSchema);
