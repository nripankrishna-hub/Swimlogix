const Institution = require('../models/Institution');
const User = require('../models/User');
const Batch = require('../models/Batch');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const storageService = require('../services/storageService');
const { ensureInstitutionCode } = require('../services/institutionService');

/** GET /api/v1/admin/profile */
const getProfile = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const [students, pending, moderators, batches] = await Promise.all([
    StudentProfile.countDocuments({ institutionId: institution._id, approvalStatus: 'approved' }),
    StudentProfile.countDocuments({ institutionId: institution._id, approvalStatus: 'pending' }),
    User.countDocuments({ institutionId: institution._id, role: 'moderator' }),
    Batch.countDocuments({ institutionId: institution._id }),
  ]);

  res.status(200).json({
    success: true,
    data: { institution, usage: { students, pending, moderators, batches } },
  });
});

/**
 * PUT /api/v1/admin/profile
 * Saves institution details (address, policy, fee structure, contact).
 * The **Unique Institution Code** is minted here on first save.
 */
const setupProfile = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const { name, address, policy, feeStructure, contact } = req.body;
  if (name !== undefined) institution.name = name;
  if (address !== undefined) institution.address = { ...institution.address.toObject(), ...address };
  if (policy !== undefined) institution.policy = policy;
  if (contact !== undefined) institution.contact = { ...institution.contact.toObject(), ...contact };
  if (feeStructure !== undefined) institution.feeStructure = feeStructure;

  const codeGenerated = !institution.code;
  await ensureInstitutionCode(institution);
  institution.isProfileComplete = true;
  await institution.save();

  res.status(200).json({
    success: true,
    message: codeGenerated
      ? `Profile saved. Your Institution Code is ${institution.code}`
      : 'Institution profile updated',
    data: { institution, codeGenerated },
  });
});

/** POST /api/v1/admin/profile/logo  (multipart/form-data, field: "logo") */
const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No logo file received (expected field "logo")');

  const institution = await Institution.findById(req.institutionId);
  if (!institution) throw ApiError.notFound('Institution not found');

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const { url, publicId } = await storageService.uploadImage(req.file.buffer, {
    folder: 'institution-logos',
    mimetype: req.file.mimetype,
    baseUrl,
  });

  if (institution.logoPublicId) await storageService.destroyImage(institution.logoPublicId);
  institution.logoUrl = url;
  institution.logoPublicId = publicId;
  await institution.save();

  res.status(200).json({ success: true, message: 'Logo uploaded', data: { logoUrl: url } });
});

/** GET /api/v1/admin/registration-fields */
const getRegistrationFields = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.institutionId).select('registrationFields isProfileComplete code');
  if (!institution) throw ApiError.notFound('Institution not found');
  res.status(200).json({ success: true, data: institution });
});

/**
 * PUT /api/v1/admin/registration-fields
 * Body: { fields: [{ key, label, type, required, options, placeholder }] }
 * Defines the dynamic enrollment form the family members will fill in.
 */
const updateRegistrationFields = asyncHandler(async (req, res) => {
  const fields = req.body.fields || [];
  const keys = fields.map((f) => f.key);
  if (new Set(keys).size !== keys.length) throw ApiError.badRequest('Each field "key" must be unique');

  const institution = await Institution.findByIdAndUpdate(
    req.institutionId,
    { registrationFields: fields.map((f, i) => ({ ...f, order: f.order ?? i })) },
    { new: true, runValidators: true },
  );
  if (!institution) throw ApiError.notFound('Institution not found');

  res.status(200).json({ success: true, message: 'Enrollment form updated', data: institution.registrationFields });
});

/** PATCH /api/v1/admin/settings/pin-mode  Body: { pinMode: 'auto' | 'sequential' } */
const updatePinMode = asyncHandler(async (req, res) => {
  const { pinMode } = req.body;
  if (!['auto', 'sequential'].includes(pinMode)) throw ApiError.badRequest('pinMode must be "auto" or "sequential"');

  const institution = await Institution.findByIdAndUpdate(req.institutionId, { pinMode }, { new: true });
  if (!institution) throw ApiError.notFound('Institution not found');

  res.status(200).json({ success: true, message: `PIN allocation mode set to ${pinMode}`, data: { pinMode } });
});

module.exports = {
  getProfile,
  setupProfile,
  uploadLogo,
  getRegistrationFields,
  updateRegistrationFields,
  updatePinMode,
};
