const User = require('../models/User');
const Institution = require('../models/Institution');
const StudentProfile = require('../models/StudentProfile');
const Batch = require('../models/Batch');
const Notification = require('../models/Notification');
const SwimTest = require('../models/SwimTest');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { getInstitutionPreview } = require('../services/institutionService');
const notificationService = require('../services/notificationService');
const { computeAttendanceStats, getStudentProgress } = require('../services/progressService');

/** Load the caller's student profile or explain why it is not ready yet. */
async function requireProfile(user) {
  if (!user.institutionId) throw ApiError.badRequest('Link an institution first', 'NO_INSTITUTION');
  const profile = await StudentProfile.findOne({ userId: user._id });
  if (!profile) throw ApiError.badRequest('Complete your registration first', 'NO_PROFILE');
  return profile;
}

/**
 * GET /api/v1/students/institution-preview?code=ABC123
 * Shown in the Institution Code confirmation modal BEFORE locking the link.
 */
const institutionPreview = asyncHandler(async (req, res) => {
  const preview = await getInstitutionPreview(req.query.code || req.body.code);
  res.status(200).json({ success: true, data: preview });
});

/**
 * POST /api/v1/students/link-institution
 * Body: { institutionCode }
 * One-time institution linking. Creates a draft profile that the Admin must approve.
 */
const linkInstitution = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const preview = await getInstitutionPreview(req.body.institutionCode);

  const institution = await Institution.findById(preview.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');
  if (institution.status !== 'active') throw ApiError.forbidden('This institution is not accepting registrations');
  if (institution.subscriptionValidity && new Date(institution.subscriptionValidity).getTime() < Date.now()) {
    throw ApiError.forbidden('This institution subscription has expired');
  }

  user.institutionId = institution._id;
  await user.save();

  let profile = await StudentProfile.findOne({ userId: user._id });
  if (!profile) {
    profile = await StudentProfile.create({
      userId: user._id,
      institutionId: institution._id,
      approvalStatus: 'draft',
    });
  } else if (profile.approvalStatus === 'approved') {
    throw ApiError.conflict('You are already approved in an institution. Change it from Profile settings.');
  } else {
    profile.institutionId = institution._id;
    profile.approvalStatus = 'draft';
    await profile.save();
  }

  res.status(200).json({
    success: true,
    message: `Linked to ${institution.name}`,
    data: { institution: preview, profile: { approvalStatus: profile.approvalStatus }, nextStep: 'complete_registration' },
  });
});

/**
 * PATCH /api/v1/students/institution
 * Body: { institutionCode }
 * Changing institution is only permitted from Profile settings and resets approval + PIN.
 */
const changeInstitution = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const preview = await getInstitutionPreview(req.body.institutionCode);

  if (String(user.institutionId) === String(preview.institutionId)) {
    throw ApiError.badRequest('You are already linked to this institution');
  }

  const profile = await StudentProfile.findOne({ userId: user._id });
  if (!profile) throw ApiError.badRequest('Complete your registration first', 'NO_PROFILE');

  user.institutionId = preview.institutionId;
  await user.save();

  profile.institutionId = preview.institutionId;
  profile.assignedPin = null; // a new PIN will be issued after approval
  profile.approvalStatus = 'draft';
  profile.rejectionReason = '';
  profile.batchId = null;
  profile.approvedBy = null;
  profile.approvedAt = null;
  await profile.save();

  res.status(200).json({
    success: true,
    message: `Institution changed to ${preview.name}. Please submit your registration for approval.`,
    data: { institution: preview, nextStep: 'complete_registration' },
  });
});

/**
 * GET /api/v1/students/registration-form
 * The dynamic enrollment schema defined by the Admin + previous answers.
 */
const getRegistrationForm = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const institution = await Institution.findById(req.user.institutionId).select(
    'name code logoUrl registrationFields policy',
  );

  res.status(200).json({
    success: true,
    data: {
      institution: {
        name: institution.name,
        code: institution.code,
        logoUrl: institution.logoUrl,
        policy: institution.policy,
      },
      fields: institution.registrationFields,
      values: profile.registrationData || {},
      approvalStatus: profile.approvalStatus,
    },
  });
});

/**
 * POST /api/v1/students/registration
 * Body: { data: { key: value }, name? }
 * Submits the dynamic enrollment form -> status becomes "pending" awaiting Admin approval.
 */
const submitRegistration = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const institution = await Institution.findById(req.user.institutionId);

  const input = req.body.data || {};
  const errors = [];
  institution.registrationFields.forEach((field) => {
    const value = input[field.key];
    const empty = value === undefined || value === null || value === '';
    if (field.required && empty) errors.push({ field: field.key, message: `${field.label} is required` });
  });
  if (errors.length) throw ApiError.unprocessable('Please complete all required fields', errors);

  profile.registrationData = input;
  profile.approvalStatus = 'pending';
  profile.rejectionReason = '';
  await profile.save();

  if (req.body.name) {
    await User.findByIdAndUpdate(req.user._id, { name: req.body.name });
  }

  res.status(200).json({
    success: true,
    message: 'Registration submitted. Your institution admin will review it shortly.',
    data: { approvalStatus: profile.approvalStatus },
  });
});

/** PATCH /api/v1/students/profile  Body: { name?, email?, profilePhotoUrl? } */
const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  ['name', 'email', 'profilePhotoUrl'].forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user.toSafeJSON() });
});

/** POST /api/v1/students/family-members  Body: { name, relation?, age?, gender?, phone?, notes? } */
const addFamilyMember = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  profile.familyMembers.push(req.body);
  await profile.save();
  res.status(201).json({ success: true, message: 'Family member added', data: profile.familyMembers });
});

/** PATCH /api/v1/students/family-members/:memberId */
const updateFamilyMember = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const member = profile.familyMembers.id(req.params.memberId);
  if (!member) throw ApiError.notFound('Family member not found');

  ['name', 'relation', 'age', 'gender', 'phone', 'notes'].forEach((k) => {
    if (req.body[k] !== undefined) member[k] = req.body[k];
  });
  await profile.save();
  res.status(200).json({ success: true, data: profile.familyMembers });
});

/** DELETE /api/v1/students/family-members/:memberId */
const removeFamilyMember = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const member = profile.familyMembers.id(req.params.memberId);
  if (!member) throw ApiError.notFound('Family member not found');

  member.deleteOne();
  await profile.save();
  res.status(200).json({ success: true, message: 'Family member removed', data: profile.familyMembers });
});

/**
 * GET /api/v1/students/dashboard
 * Member home: PIN card, progress %, next class, inbox size, fee status.
 */
const dashboard = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const institution = await Institution.findById(req.user.institutionId).select(
    'name code logoUrl address policy feeStructure',
  );

  const approved = profile.approvalStatus === 'approved';
  const batch = profile.batchId
    ? await Batch.findById(profile.batchId).select('name days timing level coachId').populate('coachId', 'name')
    : null;

  const [attendance, swimTests, unreadCount] = await Promise.all([
    computeAttendanceStats({ institutionId: req.user.institutionId, studentId: profile._id }),
    approved
      ? SwimTest.find({ studentId: profile._id, institutionId: req.user.institutionId }).sort({ testDate: -1 }).limit(5)
      : [],
    Notification.countDocuments({
      ...notificationService.inboxFilter(req.user.institutionId, profile),
      readBy: { $not: { $elemMatch: { user: req.user._id } } },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      approvalStatus: profile.approvalStatus,
      rejectionReason: profile.rejectionReason,
      pin: approved ? profile.assignedPin : null,
      institution: {
        name: institution.name,
        code: institution.code,
        logoUrl: institution.logoUrl,
        address: institution.address,
      },
      batch,
      attendance,
      recentSwimTests: swimTests,
      unreadNotifications: unreadCount,
      fee: { status: profile.feeStatus, dueAmount: profile.feeDueAmount, dueDate: profile.feeDueDate },
      milestones: profile.milestones.slice(-5).reverse(),
    },
  });
});

/** GET /api/v1/students/progress */
const progress = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const data = await getStudentProgress(profile._id, req.user.institutionId, {
    from: req.query.from,
    to: req.query.to,
  });
  res.status(200).json({ success: true, data: { pin: profile.assignedPin, ...data } });
});

/** GET /api/v1/students/fees */
const fees = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const institution = await Institution.findById(req.user.institutionId).select('name feeStructure contact');
  res.status(200).json({
    success: true,
    data: {
      status: profile.feeStatus,
      dueAmount: profile.feeDueAmount,
      dueDate: profile.feeDueDate,
      feeStructure: institution.feeStructure,
      payableTo: institution.name,
      contact: institution.contact,
    },
  });
});

/** GET /api/v1/students/schedule */
const schedule = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const batch = profile.batchId
    ? await Batch.findById(profile.batchId).select('name days timing level coachId').populate('coachId', 'name phone')
    : null;
  res.status(200).json({ success: true, data: { batch } });
});

/** GET /api/v1/students/notifications?page=&limit= */
const listNotifications = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const { page, limit, skip } = getPagination(req.query);

  const filter = notificationService.inboxFilter(req.user.institutionId, profile);
  const [items, total] = await Promise.all([
    Notification.find(filter).populate('senderId', 'name role').sort({ timestamp: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  const withRead = items.map((n) => ({
    ...n.toJSON(),
    isRead: (n.readBy || []).some((r) => String(r.user) === String(req.user._id)),
  }));

  res.status(200).json({ success: true, data: { items: withRead, meta: buildMeta(total, { page, limit }) } });
});

/** POST /api/v1/students/notifications/:notificationId/read */
const markNotificationRead = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req.user);
  const filter = {
    _id: req.params.notificationId,
    ...notificationService.inboxFilter(req.user.institutionId, profile),
  };
  const notification = await Notification.findOne(filter);
  if (!notification) throw ApiError.notFound('Notification not found');

  const already = (notification.readBy || []).some((r) => String(r.user) === String(req.user._id));
  if (!already) {
    notification.readBy.push({ user: req.user._id });
    await notification.save();
  }

  res.status(200).json({ success: true, message: 'Marked as read' });
});

module.exports = {
  institutionPreview,
  linkInstitution,
  changeInstitution,
  getRegistrationForm,
  submitRegistration,
  updateProfile,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  dashboard,
  progress,
  fees,
  schedule,
  listNotifications,
  markNotificationRead,
};


