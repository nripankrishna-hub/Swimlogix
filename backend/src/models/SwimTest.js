const mongoose = require('mongoose');
const { Schema } = mongoose;

const SwimTestSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null, index: true },

    testName: { type: String, required: true, trim: true },
    skill: { type: String, trim: true, default: '' },
    testDate: { type: Date, required: true, default: Date.now },

    marks: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, default: 100, min: 1 },
    result: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },

    evaluatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

SwimTestSchema.virtual('percentage').get(function percentage() {
  if (!this.maxMarks) return 0;
  return Math.round((this.marks / this.maxMarks) * 100);
});

SwimTestSchema.index({ institutionId: 1, studentId: 1, testDate: -1 });

module.exports = mongoose.model('SwimTest', SwimTestSchema);
