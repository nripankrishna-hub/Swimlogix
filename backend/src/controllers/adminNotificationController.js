const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const notificationService = require('../services/notificationService');

/**
 * POST /api/v1/admin/notifications
 * Body: { targetAudience: 'all'|'batch'|'student', batchId?, studentId?, title, body }
 */
const sendNotification = asyncHandler(async (req, res) => {
  const { targetAudience, batchId, studentId, title, body } = req.body;

  if (targetAudience === 'batch' && !batchId) throw ApiError.badRequest('batchId is required for batch notifications');
  if (targetAudience === 'student' && !studentId) {
    throw ApiError.badRequest('studentId is required for individual notifications');
  }

  const { notification, recipientCount } = await notificationService.sendNotification({
    institutionId: req.institutionId,
    sender: req.user,
    targetAudience,
    batchId: batchId || null,
    studentId: studentId || null,
    title,
    body,
  });

  res.status(201).json({
    success: true,
    message: `Notification sent to ${recipientCount} member(s)`,
    data: { notification, recipientCount },
  });
});

/** GET /api/v1/admin/notifications?page=&limit=&targetAudience= */
const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { institutionId: req.institutionId };
  if (req.query.targetAudience) filter.targetAudience = req.query.targetAudience;

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .populate('senderId', 'name role')
      .populate('batchId', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { items, meta: buildMeta(total, { page, limit }) } });
});

module.exports = { sendNotification, listNotifications };
