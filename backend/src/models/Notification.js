const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReadReceiptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const NotificationSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['superadmin', 'admin', 'moderator'], default: 'admin' },

    targetAudience: { type: String, enum: ['all', 'batch', 'student'], required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', default: null },

    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    data: { type: Map, of: String, default: () => new Map() },

    readBy: { type: [ReadReceiptSchema], default: [] },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Inbox query for a family account.
NotificationSchema.index({ institutionId: 1, targetAudience: 1, timestamp: -1 });
NotificationSchema.index({ institutionId: 1, batchId: 1, timestamp: -1 });
NotificationSchema.index({ institutionId: 1, studentId: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
