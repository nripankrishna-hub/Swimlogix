const Institution = require('../models/Institution');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateInstitutionCode } = require('../utils/generators');

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

/** Generate a code that is guaranteed to be unique across the platform. */
async function generateUniqueInstitutionCode(length = CODE_LENGTH) {
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const candidate = generateInstitutionCode(length);
    // eslint-disable-next-line no-await-in-loop
    const exists = await Institution.exists({ code: candidate });
    if (!exists) return candidate;
  }
  throw ApiError.conflict('Could not generate a unique institution code, please retry');
}

/**
 * The unique institution code is minted the first time the Admin saves profile setup.
 * Idempotent: returns the existing code if already present.
 */
async function ensureInstitutionCode(institution) {
  if (institution.code) return institution.code;
  const code = await generateUniqueInstitutionCode();
  institution.code = code;
  return code;
}

const formatLocation = (address = {}) =>
  [address.city, address.state, address.country].filter(Boolean).join(', ') || address.line1 || '';

/**
 * Public preview shown to a family member *before* linking, so they can confirm
 * the institution name, tutor and location.
 */
async function getInstitutionPreview(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) throw ApiError.badRequest('Institution code is required');

  const institution = await Institution.findOne({ code }).select(
    'name code address logoUrl status subscriptionValidity',
  );
  if (!institution) throw ApiError.notFound('No institution matches that code', 'INSTITUTION_NOT_FOUND');

  const tutor = await User.findOne({ institutionId: institution._id, role: 'admin', status: 'active' }).select(
    'name phone',
  );

  return {
    institutionId: institution._id,
    name: institution.name,
    code: institution.code,
    logoUrl: institution.logoUrl,
    tutorName: tutor ? tutor.name : 'Institution Admin',
    tutorPhone: tutor ? tutor.phone : '',
    location: formatLocation(institution.address),
    address: institution.address,
    status: institution.status,
    isSubscriptionValid: institution.subscriptionValidity
      ? new Date(institution.subscriptionValidity).getTime() > Date.now()
      : false,
  };
}

module.exports = { generateUniqueInstitutionCode, ensureInstitutionCode, getInstitutionPreview, formatLocation };
