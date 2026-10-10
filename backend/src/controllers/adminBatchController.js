const Batch = require('../models/Batch');
const Institution = require('../models/Institution');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/** POST /api/v1/admin/batches */
const createBatch = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const hasRoom = await institution.hasCapacity('batches');
  if (!hasRoom) {
    throw ApiError.forbidden(
      `Batch limit reached (${institution.limits.maxBatches}). Contact the platform administrator to increase it.`,
      'LIMIT_REACHED',
    );
  }

  const { name, description, level, timing, days, coachId, capacity, startDate, endDate, feeAmount, isFree } = req.body;

  if (coachId) {
    const coach = await User.findOne({ _id: coachId, institutionId: institution._id, role: 'moderator' });
    if (!coach) throw ApiError.badRequest('coachId must reference a moderator of this institution');
  }

  const batch = await Batch.create({
    institutionId: institution._id,
    name,
    description,
    level,
    timing,
    days,
    coachId: coachId || null,
    capacity,
    feeAmount: feeAmount || 0,
    isFree: isFree || false,
    startDate: startDate || null,
    endDate: endDate || null,
    swimTestCriteria: req.body.swimTestCriteria || null,
  });

  res.status(201).json({ success: true, data: batch });
});

/** GET /api/v1/admin/batches?status=&search=&page=&limit= */
const listBatches = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { institutionId: req.institutionId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.name = new RegExp(String(req.query.search).trim(), 'i');

  const [items, total] = await Promise.all([
    Batch.find(filter).populate('coachId', 'name phone').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Batch.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { items, meta: buildMeta(total, { page, limit }) } });
});

/** GET /api/v1/admin/batches/:batchId */
const getBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({ _id: req.params.batchId, institutionId: req.institutionId }).populate(
    'coachId',
    'name phone',
  );
  if (!batch) throw ApiError.notFound('Batch not found');

  const roster = await StudentProfile.find({ institutionId: req.institutionId, batchId: batch._id, approvalStatus: 'approved' })
    .populate('userId', 'name phone')
    .select('userId assignedPin registrationData');

  res.status(200).json({ success: true, data: { batch, roster } });
});

/** PATCH /api/v1/admin/batches/:batchId */
const updateBatch = asyncHandler(async (req, res) => {
  if (req.body.coachId) {
    const coach = await User.findOne({
      _id: req.body.coachId,
      institutionId: req.institutionId,
      role: 'moderator',
    });
    if (!coach) throw ApiError.badRequest('coachId must reference a moderator of this institution');
  }

  const batch = await Batch.findOneAndUpdate(
    { _id: req.params.batchId, institutionId: req.institutionId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!batch) throw ApiError.notFound('Batch not found');

  res.status(200).json({ success: true, data: batch });
});

/**
 * DELETE /api/v1/admin/batches/:batchId
 * Blocked while approved students are still enrolled (reassign them first).
 */
const deleteBatch = asyncHandler(async (req, res) => {
  const enrolled = await StudentProfile.countDocuments({
    institutionId: req.institutionId,
    batchId: req.params.batchId,
  });
  if (enrolled > 0) {
    throw ApiError.conflict(`Cannot delete: ${enrolled} student(s) are still assigned to this batch`, 'BATCH_NOT_EMPTY');
  }

  const batch = await Batch.findOneAndDelete({ _id: req.params.batchId, institutionId: req.institutionId });
  if (!batch) throw ApiError.notFound('Batch not found');

  res.status(200).json({ success: true, message: 'Batch deleted' });
});

/** PATCH /api/v1/admin/batches/:batchId/coach  Body: { coachId } */
const assignCoach = asyncHandler(async (req, res) => {
  const { coachId } = req.body;
  const coach = await User.findOne({ _id: coachId, institutionId: req.institutionId, role: 'moderator' });
  if (!coach) throw ApiError.badRequest('coachId must reference a moderator of this institution');

  const batch = await Batch.findOneAndUpdate(
    { _id: req.params.batchId, institutionId: req.institutionId },
    { coachId: coach._id },
    { new: true },
  ).populate('coachId', 'name phone');
  if (!batch) throw ApiError.notFound('Batch not found');

  res.status(200).json({ success: true, data: batch });
});

module.exports = { createBatch, listBatches, getBatch, updateBatch, deleteBatch, assignCoach };
