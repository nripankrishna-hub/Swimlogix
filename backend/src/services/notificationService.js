const Notification = require('../models/Notification');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const pushService = require('./pushService');
const logger = require('../utils/logger');

/** Resolve the User documents that should receive a notification. */
async function resolveRecipients({ institutionId, targetAudience, batchId, studentId }) {
  if (targetAudience === 'student') {
    const profile = await StudentProfile.findOne({ _id: studentId, institutionId }).select('userId');
    if (!profile) return [];
    const user = await User.findById(profile.userId);
    return user ? [user] : [];
  }

  const profileFilter = { institutionId, approvalStatus: 'approved' };
  if (targetAudience === 'batch') profileFilter.batchId = batchId;

  const profiles = await StudentProfile.find(profileFilter).select('userId');
  const userIds = profiles.map((p) => p.userId);
  if (!userIds.length) return [];

  return User.find({ _id: { $in: userIds }, status: { $ne: 'suspended' } });
}

/**
 * Persist an in-app notification AND fan it out over FCM.
 * Used by both the Admin communication hub and Moderator announcements.
 */
async function sendNotification({
  institutionId,
  sender,
  targetAudience,
  batchId = null,
  studentId = null,
  title,
  body,
  data = {},
}) {
  const notification = await Notification.create({
    institutionId,
    senderId: sender._id,
    senderRole: sender.role,
    targetAudience,
    batchId,
    studentId,
    title,
    body,
    data,
  });

  let recipientCount = 0;
  try {
    const recipients = await resolveRecipients({ institutionId, targetAudience, batchId, studentId });
    const result = await pushService.sendPushToUsers(recipients, {
      title,
      body,
      data: { type: 'notification', notificationId: String(notification._id), ...data },
    });
    recipientCount = recipients.length;
    logger.debug(`Notification ${notification._id} -> ${JSON.stringify(result)}`);
  } catch (err) {
    // Push failures must never fail the API call - the in-app inbox is the source of truth.
    logger.error('Notification fan-out failed:', err.message);
  }

  return { notification, recipientCount };
}

/** Notifications visible to a given student profile (all + their batch + personal). */
function inboxFilter(institutionId, studentProfile) {
  return {
    institutionId,
    $or: [
      { targetAudience: 'all' },
      { targetAudience: 'batch', batchId: studentProfile.batchId },
      { targetAudience: 'student', studentId: studentProfile._id },
    ],
  };
}

module.exports = { sendNotification, resolveRecipients, inboxFilter };
