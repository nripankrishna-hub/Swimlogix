const User = require('../models/User');
const Institution = require('../models/Institution');
const Batch = require('../models/Batch');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { normalizePhone } = require('../utils/phone');
const { getPagination, buildMeta } = require('../utils/pagination');
const { generateTempPassword } = require('../utils/generators');

/**
 * POST /api/v1/admin/moderators
 * Body: { name, phone, password, mustChangePassword? }
 * The Admin creates the moderator credential (mobile number + password).
 */
const createModerator = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const hasRoom = await institution.hasCapacity('moderators');
  if (!hasRoom) {
    throw ApiError.forbidden(
      `Moderator limit reached (${institution.limits.maxModerators}). Contact the platform administrator.`,
      'LIMIT_REACHED',
    );
  }

  const phone = normalizePhone(req.body.phone);
  const exists = await User.findOne({ phone });
  if (exists) throw ApiError.conflict('An account with this mobile number already exists', 'PHONE_TAKEN');

  const moderator = new User({
    name: req.body.name,
    phone,
    role: 'moderator',
    institutionId: institution._id,
    status: 'active',
    isPasswordChanged: !req.body.mustChangePassword,
    mustChangePassword: !!req.body.mustChangePassword,
    createdBy: req.user._id,
  });
  
  const initialPassword = req.body.password || generateTempPassword(8);
  await moderator.setPassword(initialPassword);
  await moderator.save();

  res.status(201).json({
    success: true,
    message: 'Moderator created',
    data: { moderator: moderator.toSafeJSON() },
  });
});

/** GET /api/v1/admin/moderators?status=&search=&page=&limit= */
const listModerators = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { institutionId: req.institutionId, role: 'moderator' };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).trim(), 'i');
    filter.$or = [{ name: rx }, { phone: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  // Attach batch assignments for a richer admin list.
  const StudentProfile = require('../models/StudentProfile');
  const enriched = await Promise.all(
    items.map(async (m) => {
      const [batches, isStudent] = await Promise.all([
        Batch.find({ institutionId: req.institutionId, coachId: m._id }).select('name days timing'),
        StudentProfile.exists({ userId: m._id })
      ]);
      return { ...m.toSafeJSON(), batches, isStudent: !!isStudent };
    }),
  );

  res.status(200).json({ success: true, data: { items: enriched, meta: buildMeta(total, { page, limit }) } });
});

/** PATCH /api/v1/admin/moderators/:userId  Body: { name?, status? } */
const updateModerator = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.status !== undefined) {
    if (!['active', 'suspended'].includes(req.body.status)) throw ApiError.badRequest('status must be active or suspended');
    updates.status = req.body.status;
  }

  const moderator = await User.findOneAndUpdate(
    { _id: req.params.userId, institutionId: req.institutionId, role: 'moderator' },
    updates,
    { new: true, runValidators: true },
  );
  if (!moderator) throw ApiError.notFound('Moderator not found');

  res.status(200).json({ success: true, data: moderator.toSafeJSON() });
});

/** POST /api/v1/admin/moderators/:userId/reset-password */
const resetModeratorPassword = asyncHandler(async (req, res) => {
  const moderator = await User.findOne({
    _id: req.params.userId,
    institutionId: req.institutionId,
    role: 'moderator',
  });
  if (!moderator) throw ApiError.notFound('Moderator not found');

  const tempPassword = generateTempPassword(10);
  await moderator.setPassword(tempPassword);
  moderator.mustChangePassword = true;
  moderator.isPasswordChanged = false;
  await moderator.save();

  res.status(200).json({
    success: true,
    message: 'Temporary password generated',
    data: { userId: moderator._id, temporaryPassword: tempPassword },
  });
});

/** DELETE /api/v1/admin/moderators/:userId (soft: suspends + unassigns batches) */
const removeModerator = asyncHandler(async (req, res) => {
  const moderator = await User.findOne({
    _id: req.params.userId,
    institutionId: req.institutionId,
    role: 'moderator',
  });
  if (!moderator) throw ApiError.notFound('Moderator not found');

  moderator.status = 'suspended';
  await moderator.save();
  await Batch.updateMany({ institutionId: req.institutionId, coachId: moderator._id }, { coachId: null });

  res.status(200).json({ success: true, message: 'Moderator suspended and unassigned from batches' });
});

/** DELETE /api/v1/admin/moderators/:userId/hard (Revoke moderator role) */
const hardDeleteModerator = asyncHandler(async (req, res) => {
  const moderator = await User.findOne({
    _id: req.params.userId,
    institutionId: req.institutionId,
    role: 'moderator',
  });
  if (!moderator) throw ApiError.notFound('Moderator not found');

  // Instead of deleting the user (they might be a parent/student), just revoke the role.
  moderator.role = 'member';
  await moderator.save();

  await Batch.updateMany({ institutionId: req.institutionId, coachId: moderator._id }, { coachId: null });

  res.status(200).json({ success: true, message: 'Moderator role revoked successfully' });
});

/** DELETE /api/v1/admin/moderators/:userId/true-delete (Delete from DB completely) */
const trueDeleteModerator = asyncHandler(async (req, res) => {
  const moderator = await User.findOneAndDelete({
    _id: req.params.userId,
    institutionId: req.institutionId,
    role: 'moderator',
  });
  if (!moderator) throw ApiError.notFound('Moderator not found');

  await Batch.updateMany({ institutionId: req.institutionId, coachId: moderator._id }, { coachId: null });

  res.status(200).json({ success: true, message: 'Moderator permanently deleted from database' });
});

/** POST /api/v1/admin/moderators/promote */
const promoteStudent = asyncHandler(async (req, res) => {
  const { studentUserId } = req.body;
  if (!studentUserId) throw ApiError.badRequest('studentUserId is required');

  const user = await User.findOne({ _id: studentUserId, institutionId: req.institutionId });
  if (!user) throw ApiError.notFound('User not found');
  
  if (user.role === 'moderator') throw ApiError.badRequest('User is already a moderator');

  user.role = 'moderator';
  await user.save();

  res.status(200).json({ success: true, message: 'Student successfully promoted to Moderator', data: user.toSafeJSON() });
});

module.exports = { createModerator, listModerators, updateModerator, resetModeratorPassword, removeModerator, hardDeleteModerator, trueDeleteModerator, promoteStudent };
