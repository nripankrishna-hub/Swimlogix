const Institution = require('../models/Institution');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Batch = require('../models/Batch');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { normalizePhone } = require('../utils/phone');
const { generateTempPassword } = require('../utils/generators');

/** Create an Admin account bound to an institution with a one-time temporary password. */
async function createAdminAccount({ name, phone, institutionId, createdBy }) {
  const normalized = normalizePhone(phone);
  if (!normalized) throw ApiError.badRequest('Admin mobile number is required');

  const exists = await User.findOne({ phone: normalized });
  if (exists) throw ApiError.conflict('An account with this mobile number already exists', 'PHONE_TAKEN');

  const tempPassword = generateTempPassword(10);
  const admin = new User({
    name: name || 'Institution Admin',
    phone: normalized,
    role: 'admin',
    institutionId,
    status: 'active',
    isPasswordChanged: false,
    mustChangePassword: true,
    createdBy,
  });
  await admin.setPassword(tempPassword);
  await admin.save();
  return { admin, tempPassword };
}

/**
 * POST /api/v1/superadmin/institutions
 * Register a new institution + its first Admin account in a single call.
 */
const createInstitution = asyncHandler(async (req, res) => {
  const { name, contact = {}, address = {}, subscriptionValidity, limits = {}, admin } = req.body;

  if (!admin || !admin.phone) throw ApiError.badRequest('An initial Admin (name + mobile) is required');

  const institution = await Institution.create({
    name,
    contact,
    address,
    subscriptionValidity: subscriptionValidity ? new Date(subscriptionValidity) : null,
    limits,
    createdBy: req.user._id,
    status: 'active',
  });

  const { admin: adminUser, tempPassword } = await createAdminAccount({
    name: admin.name,
    phone: admin.phone,
    institutionId: institution._id,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Institution registered. Share the temporary password with the Admin.',
    data: {
      institution,
      admin: adminUser.toSafeJSON(),
      temporaryPassword: tempPassword, // displayed once, never retrievable again
    },
  });
});

/**
 * GET /api/v1/superadmin/institutions?search=&status=&page=&limit=
 */
const listInstitutions = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).trim(), 'i');
    filter.$or = [{ name: rx }, { code: rx }, { 'contact.phone': rx }];
  }

  const [items, total] = await Promise.all([
    Institution.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Institution.countDocuments(filter),
  ]);

  // Attach lightweight usage counters so the SuperAdmin table is useful at a glance.
  const enriched = await Promise.all(
    items.map(async (inst) => {
      const [students, moderators, batches] = await Promise.all([
        StudentProfile.countDocuments({ institutionId: inst._id, approvalStatus: 'approved' }),
        User.countDocuments({ institutionId: inst._id, role: 'moderator' }),
        Batch.countDocuments({ institutionId: inst._id }),
      ]);
      return { ...inst.toJSON(), usage: { students, moderators, batches } };
    }),
  );

  res.status(200).json({
    success: true,
    data: { items: enriched, total, page, limit, pages: Math.ceil(total / limit) || 1 },
  });
});

/** GET /api/v1/superadmin/institutions/:institutionId */
const getInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const [admins, students, moderators, batches] = await Promise.all([
    User.find({ institutionId: institution._id, role: 'admin' }).select(
      'name phone status isPasswordChanged lastLoginAt',
    ),
    StudentProfile.countDocuments({ institutionId: institution._id, approvalStatus: 'approved' }),
    User.countDocuments({ institutionId: institution._id, role: 'moderator' }),
    Batch.countDocuments({ institutionId: institution._id }),
  ]);

  res.status(200).json({
    success: true,
    data: { institution, admins, usage: { students, moderators, batches } },
  });
});

/**
 * PATCH /api/v1/superadmin/institutions/:institutionId
 * Update subscription validity, limits, contact or status.
 */
const updateInstitution = asyncHandler(async (req, res) => {
  const allowed = ['name', 'contact', 'address', 'subscriptionValidity', 'limits', 'status'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  if (updates.subscriptionValidity) updates.subscriptionValidity = new Date(updates.subscriptionValidity);

  const institution = await Institution.findByIdAndUpdate(req.params.institutionId, updates, {
    new: true,
    runValidators: true,
  });
  if (!institution) throw ApiError.notFound('Institution not found');

  res.status(200).json({ success: true, data: institution });
});

/** POST /api/v1/superadmin/institutions/:institutionId/admins */
const addAdmin = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const { admin, tempPassword } = await createAdminAccount({
    name: req.body.name,
    phone: req.body.phone,
    institutionId: institution._id,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Admin created. Share the temporary password securely.',
    data: { admin: admin.toSafeJSON(), temporaryPassword: tempPassword },
  });
});

/** POST /api/v1/superadmin/admins/:userId/reset-password */
const resetAdminPassword = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ _id: req.params.userId, role: { $in: ['admin', 'moderator'] } });
  if (!admin) throw ApiError.notFound('Admin/Moderator account not found');

  const tempPassword = generateTempPassword(10);
  await admin.setPassword(tempPassword);
  admin.mustChangePassword = true;
  admin.isPasswordChanged = false;
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Temporary password regenerated. The user must change it on next login.',
    data: { userId: admin._id, temporaryPassword: tempPassword },
  });
});

/** PATCH /api/v1/superadmin/users/:userId/status  Body: { status } */
const setUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'pending', 'suspended'].includes(status)) throw ApiError.badRequest('Invalid status');

  const user = await User.findById(req.params.userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'superadmin') throw ApiError.forbidden('SuperAdmin accounts cannot be modified here');

  user.status = status;
  await user.save();
  res.status(200).json({ success: true, data: user.toSafeJSON() });
});

/**
 * GET /api/v1/superadmin/stats
 * Platform-wide KPIs + institutions whose subscription expires within 30 days.
 */
const platformStats = asyncHandler(async (_req, res) => {
  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [
    totalInstitutions,
    activeInstitutions,
    suspendedInstitutions,
    expiringSoon,
    totalStudents,
    pendingStudents,
    totalModerators,
    totalAdmins,
    totalBatches,
  ] = await Promise.all([
    Institution.countDocuments({}),
    Institution.countDocuments({ status: 'active' }),
    Institution.countDocuments({ status: 'suspended' }),
    Institution.countDocuments({ subscriptionValidity: { $gte: now, $lte: soon } }),
    User.countDocuments({ role: 'student' }),
    StudentProfile.countDocuments({ approvalStatus: 'pending' }),
    User.countDocuments({ role: 'moderator' }),
    User.countDocuments({ role: 'admin' }),
    Batch.countDocuments({}),
  ]);

  const expiringList = await Institution.find({ subscriptionValidity: { $lte: soon } })
    .sort({ subscriptionValidity: 1 })
    .limit(20)
    .select('name code subscriptionValidity status');

  res.status(200).json({
    success: true,
    data: {
      institutions: {
        total: totalInstitutions,
        active: activeInstitutions,
        suspended: suspendedInstitutions,
        expiringSoon,
      },
      users: {
        students: totalStudents,
        pendingRegistrations: pendingStudents,
        moderators: totalModerators,
        admins: totalAdmins,
      },
      batches: totalBatches,
      expiringInstitutions: expiringList,
    },
  });
});

module.exports = {
  createInstitution,
  listInstitutions,
  getInstitution,
  updateInstitution,
  addAdmin,
  resetAdminPassword,
  setUserStatus,
  platformStats,
};

