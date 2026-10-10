const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Institution = require('../models/Institution');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const pinService = require('../services/pinService');
const pushService = require('../services/pushService');

const POPULATE = [
  { path: 'userId', select: 'name phone status createdAt' },
  { path: 'batchId', select: 'name timing days level' },
];

/** GET /api/v1/admin/students?approvalStatus=&batchId=&search=&page=&limit= */
const listStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { institutionId: req.institutionId };
  if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
  if (req.query.status === 'active') {
    filter.$or = [{ status: 'active' }, { status: { $exists: false } }];
  } else if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.batchId) filter.batchId = req.query.batchId;

  const pipeline = [
    { $match: filter },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $lookup: { from: 'batches', localField: 'batchId', foreignField: '_id', as: 'batch' } },
    { $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } }
  ];

  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).trim(), 'i');
    pipeline.push({ $match: { $or: [{ 'user.name': rx }, { 'user.phone': rx }, { assignedPin: rx }] } });
  }

  const countPipeline = [...pipeline, { $count: 'total' }];
  pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit });

  const [rows, countResult] = await Promise.all([
    StudentProfile.aggregate(pipeline),
    StudentProfile.aggregate(countPipeline),
  ]);
  const total = countResult[0] ? countResult[0].total : 0;

  res.status(200).json({ success: true, data: { items: rows, meta: buildMeta(total, { page, limit }) } });
});

/** GET /api/v1/admin/students/pending */
const listPendingStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { institutionId: req.institutionId, approvalStatus: 'pending' };

  const [items, total] = await Promise.all([
    StudentProfile.find(filter).populate(POPULATE).sort({ createdAt: 1 }).skip(skip).limit(limit),
    StudentProfile.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { items, meta: buildMeta(total, { page, limit }) } });
});

/** GET /api/v1/admin/students/:studentId */
const getStudent = asyncHandler(async (req, res) => {
  const student = await StudentProfile.findOne({
    _id: req.params.studentId,
    institutionId: req.institutionId,
  }).populate(POPULATE);
  if (!student) throw ApiError.notFound('Student not found');
  res.status(200).json({ success: true, data: student });
});

/**
 * PATCH /api/v1/admin/students/:studentId/approve
 * Body: { batchId?, pin? }
 * Approves the registration, optionally assigns a batch and allocates the 4-digit PIN.
 */
const approveStudent = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const student = await StudentProfile.findOne({
    _id: req.params.studentId,
    institutionId: req.institutionId,
  });
  if (!student) throw ApiError.notFound('Student not found');
  if (student.approvalStatus === 'approved') throw ApiError.conflict('Student is already approved');

  const hasRoom = await institution.hasCapacity('students');
  if (!hasRoom) {
    throw ApiError.forbidden(
      `Student limit reached (${institution.limits.maxStudents}). Upgrade the subscription to enrol more.`,
      'LIMIT_REACHED',
    );
  }

  if (req.body.batchId) {
    const batch = await Batch.findOne({ _id: req.body.batchId, institutionId: institution._id });
    if (!batch) throw ApiError.badRequest('batchId must reference a batch of this institution');
    if (student.batchId && String(student.batchId) !== String(batch._id)) {
      await Batch.findByIdAndUpdate(student.batchId, { $inc: { enrolledCount: -1 } });
    }
    student.batchId = batch._id;
    await Batch.findByIdAndUpdate(batch._id, { $inc: { enrolledCount: 1 } });
  }

  const pin = await pinService.allocatePin(institution, {
    preferredPin: req.body.pin,
    excludeProfileId: student._id,
  });

  student.assignedPin = pin;
  student.approvalStatus = 'approved';
  student.approvedBy = req.user._id;
  student.approvedAt = new Date();
  student.rejectionReason = '';
  await student.save();
});

/** PATCH /api/v1/admin/students/:studentId/reject  Body: { reason? } */
const rejectStudent = asyncHandler(async (req, res) => {
  const student = await StudentProfile.findOneAndUpdate(
    { _id: req.params.studentId, institutionId: req.institutionId },
    {
      approvalStatus: 'rejected',
      rejectionReason: req.body.reason || 'Registration does not meet the requirements',
      approvedBy: req.user._id,
      approvedAt: new Date(),
    },
    { new: true },
  );
  if (!student) throw ApiError.notFound('Student not found');

  const user = await User.findById(student.userId);
  if (user) {
    await Notification.create({
      institutionId: req.institutionId,
      senderId: req.user._id,
      senderRole: 'admin',
      targetAudience: 'student',
      studentId: student._id,
      title: 'Registration needs attention',
      body: student.rejectionReason,
    });
    await pushService.sendPushToUsers([user], {
      title: 'Registration update',
      body: student.rejectionReason,
      data: { type: 'registration_rejected' },
    });
  }

  res.status(200).json({ success: true, message: 'Registration rejected', data: student });
});

/**
 * POST /api/v1/admin/students/:studentId/assign-pin  Body: { pin? }
 * Manually set a specific PIN, or auto-generate a fresh unique one.
 */
const assignPin = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const student = await StudentProfile.findOne({
    _id: req.params.studentId,
    institutionId: req.institutionId,
  });
  if (!student) throw ApiError.notFound('Student not found');

  const pin = await pinService.allocatePin(institution, {
    preferredPin: req.body.pin,
    excludeProfileId: student._id,
  });

  student.assignedPin = pin;
  await student.save();

  res
    .status(200)
    .json({ success: true, message: `PIN ${pin} assigned`, data: { studentId: student._id, assignedPin: pin } });
});

/** PATCH /api/v1/admin/students/:studentId/batch  Body: { batchId } */
const assignBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.body;

  if (batchId === null || batchId === undefined) {
    const current = await StudentProfile.findOne({ _id: req.params.studentId, institutionId: req.institutionId });
    if (!current) throw ApiError.notFound('Student not found');
    if (current.batchId) await Batch.findByIdAndUpdate(current.batchId, { $inc: { enrolledCount: -1 } });
    current.batchId = null;
    await current.save();
    return res.status(200).json({ success: true, message: 'Student removed from batch', data: current });
  }

  const batch = await Batch.findOne({ _id: batchId, institutionId: req.institutionId });
  if (!batch) throw ApiError.badRequest('batchId must reference a batch of this institution');

  const student = await StudentProfile.findOne({ _id: req.params.studentId, institutionId: req.institutionId });
  if (!student) throw ApiError.notFound('Student not found');

  if (student.batchId && String(student.batchId) !== String(batch._id)) {
    await Batch.findByIdAndUpdate(student.batchId, { $inc: { enrolledCount: -1 } });
  }
  if (String(student.batchId) !== String(batch._id)) {
    await Batch.findByIdAndUpdate(batch._id, { $inc: { enrolledCount: 1 } });
  }
  student.batchId = batch._id;
  await student.save();

  return res.status(200).json({ success: true, message: `Assigned to ${batch.name}`, data: student });
});

/** PATCH /api/v1/admin/students/:studentId/fees  Body: { feeStatus, feeDueAmount?, feeDueDate? } */
const updateFeeStatus = asyncHandler(async (req, res) => {
  const { feeStatus, feeDueAmount, feeDueDate } = req.body;
  if (!['paid', 'pending', 'partial', 'overdue'].includes(feeStatus)) {
    throw ApiError.badRequest('Invalid feeStatus');
  }

  const student = await StudentProfile.findOneAndUpdate(
    { _id: req.params.studentId, institutionId: req.institutionId },
    {
      feeStatus,
      ...(feeDueAmount !== undefined ? { feeDueAmount } : {}),
      ...(feeDueDate !== undefined ? { feeDueDate: feeDueDate ? new Date(feeDueDate) : null } : {}),
    },
    { new: true },
  );
  if (!student) throw ApiError.notFound('Student not found');

  res.status(200).json({ success: true, data: { studentId: student._id, feeStatus: student.feeStatus } });
});

/** DELETE /api/v1/admin/students/:studentId */
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await StudentProfile.findOneAndDelete({ _id: req.params.studentId, institutionId: req.institutionId });
  if (!student) throw ApiError.notFound('Student not found');
  if (student.batchId) await Batch.findByIdAndUpdate(student.batchId, { $inc: { enrolledCount: -1 } });
  res.status(200).json({ success: true, message: 'Student deleted' });
});

/** POST /api/v1/admin/students/enroll */
const enrollStudent = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const hasRoom = await institution.hasCapacity('students');
  if (!hasRoom) {
    throw ApiError.forbidden(`Student limit reached (${institution.limits.maxStudents}). Upgrade to enrol more.`, 'LIMIT_REACHED');
  }

  const { phone, registrationData, batchId, pin } = req.body;
  if (!phone) throw ApiError.badRequest('Parent phone number is required');

  let name = 'Member';
  if (registrationData) {
    name = registrationData.name || registrationData.studentName || registrationData.fullName || registrationData.firstName || name;
  }

  let user = await User.findOne({ phone, role: 'student' });
  if (!user) {
    user = await User.create({
      phone,
      name,
      role: 'student',
      institutionId: institution._id,
      status: 'active'
    });
  } else {
    user.name = name;
    await user.save();
  }

  const existing = await StudentProfile.findOne({ userId: user._id, institutionId: req.institutionId });
  if (existing && existing.approvalStatus === 'approved') {
    throw ApiError.conflict('A student with this parent phone number is already approved.');
  }

  let student = existing || new StudentProfile({ userId: user._id, institutionId: req.institutionId });

  student.registrationData = registrationData || {};
  student.approvalStatus = 'approved';
  student.approvedBy = req.user._id;
  student.approvedAt = new Date();

  if (batchId) {
    const batch = await Batch.findOne({ _id: batchId, institutionId: institution._id });
    if (!batch) throw ApiError.badRequest('Invalid batchId');
    if (String(student.batchId) !== String(batch._id)) {
       if (student.batchId) await Batch.findByIdAndUpdate(student.batchId, { $inc: { enrolledCount: -1 } });
       student.batchId = batch._id;
       await Batch.findByIdAndUpdate(batch._id, { $inc: { enrolledCount: 1 } });
    }
  }

  student.assignedPin = await pinService.allocatePin(institution, { preferredPin: pin, excludeProfileId: student._id });
  await student.save();

  res.status(201).json({ success: true, message: 'Student enrolled and approved', data: student });
});

module.exports = {
  listStudents,
  listPendingStudents,
  getStudent,
  approveStudent,
  rejectStudent,
  assignPin,
  assignBatch,
  updateFeeStatus,
  deleteStudent,
  enrollStudent,
};

