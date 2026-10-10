const mongoose = require('mongoose');
const { Schema } = mongoose;

/** Normalise a date to UTC midnight so one student/batch/day == one document. */
function atMidnightUtc(value) {
  const d = value ? new Date(value) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const AttendanceSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    moderatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    method: { type: String, enum: ['pin', 'manual'], default: 'manual' },
    note: { type: String, trim: true, default: '' },
    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

AttendanceSchema.pre('validate', function normaliseDate(next) {
  if (this.date) this.date = atMidnightUtc(this.date);
  next();
});

// One attendance record per student / batch / day.
AttendanceSchema.index({ studentId: 1, batchId: 1, date: 1 }, { unique: true });
// Dashboard: "today's logs for institution".
AttendanceSchema.index({ institutionId: 1, date: -1, batchId: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
module.exports.atMidnightUtc = atMidnightUtc;
