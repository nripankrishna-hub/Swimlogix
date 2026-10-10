const mongoose = require('mongoose');
const { Schema } = mongoose;

const BatchSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'competitive', 'adult'],
      default: 'beginner',
    },

    // Flexible timing block (start/end are "HH:mm" strings) + human readable day list.
    timing: {
      startTime: { type: String, default: '' },
      endTime: { type: String, default: '' },
    },
    days: [{ type: String, trim: true }],

    coachId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    capacity: { type: Number, default: 30, min: 1 },
    enrolledCount: { type: Number, default: 0, min: 0 },

    feeAmount: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: false },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active', index: true },
    
    // Eligibility criteria: min attendance days for swim tests
    swimTestCriteria: { type: Number, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

BatchSchema.index({ institutionId: 1, name: 1 }, { unique: true });
BatchSchema.index({ institutionId: 1, status: 1 });

module.exports = mongoose.model('Batch', BatchSchema);
