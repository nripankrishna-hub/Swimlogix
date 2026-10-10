const mongoose = require('mongoose');
const { Schema } = mongoose;

const FamilyMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, trim: true, default: 'child' },
    age: { type: Number, min: 0, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    phone: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: true },
);

const MilestoneSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'in-progress', 'achieved'], default: 'pending' },
    achievedAt: { type: Date, default: null },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const StudentProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },

    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },
    familyMembers: { type: [FamilyMemberSchema], default: [] },

    // 4-digit attendance PIN, unique within an institution.
    assignedPin: { type: String, default: null },

    // Dynamic admin-configured enrollment responses { key: value }.
    registrationData: { type: Map, of: Schema.Types.Mixed, default: () => new Map() },

    approvalStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'discontinued'],
      default: 'active',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },

    feeStatus: { type: String, enum: ['paid', 'pending', 'partial', 'overdue'], default: 'pending' },
    feeDueAmount: { type: Number, default: 0, min: 0 },
    feeDueDate: { type: Date, default: null },

    milestones: { type: [MilestoneSchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// A PIN must be unique inside a single institution (multi-tenant isolation).
StudentProfileSchema.index(
  { institutionId: 1, assignedPin: 1 },
  { unique: true, partialFilterExpression: { assignedPin: { $type: 'string' } } },
);

// Common dashboard query: pending registrations for an institution.
StudentProfileSchema.index({ institutionId: 1, approvalStatus: 1, createdAt: -1 });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
