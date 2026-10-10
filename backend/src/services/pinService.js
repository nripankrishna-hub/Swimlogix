const Institution = require('../models/Institution');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const { generatePin } = require('../utils/generators');

const PIN_MIN = 1000;
const PIN_MAX = 9999;
const MAX_ATTEMPTS = 20;

const isValidPinFormat = (pin) => /^\d{4}$/.test(String(pin || '')) && Number(pin) >= PIN_MIN && Number(pin) <= PIN_MAX;

/** True when the 4-digit PIN is free inside the given institution. */
async function isPinAvailable(institutionId, pin, excludeProfileId = null) {
  const filter = { institutionId, assignedPin: String(pin) };
  if (excludeProfileId) filter._id = { $ne: excludeProfileId };
  const existing = await StudentProfile.exists(filter);
  return !existing;
}

/**
 * Atomically reserve the next sequential PIN for an institution and verify it is unused.
 * The `$inc` guarantees two concurrent approvals never receive the same candidate.
 */
async function reserveSequentialPin(institutionId) {
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const updated = await Institution.findByIdAndUpdate(
      institutionId,
      { $inc: { nextSequentialPin: 1 } },
      { new: true, select: 'nextSequentialPin' },
    );
    if (!updated) throw ApiError.notFound('Institution not found');

    const candidate = updated.nextSequentialPin;
    if (candidate > PIN_MAX) {
      // Wrap around once the space is exhausted.
      // eslint-disable-next-line no-await-in-loop
      await Institution.findByIdAndUpdate(institutionId, { $set: { nextSequentialPin: PIN_MIN - 1 } });
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    if (await isPinAvailable(institutionId, candidate)) return String(candidate);
  }
  throw ApiError.conflict('Unable to allocate a sequential PIN, please retry', 'PIN_EXHAUSTED');
}

/** Randomly generate an unused 4-digit PIN within an institution. */
async function generateRandomPin(institutionId) {
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const candidate = generatePin();
    // eslint-disable-next-line no-await-in-loop
    if (await isPinAvailable(institutionId, candidate)) return candidate;
  }
  // Extremely unlikely: fall back to sequential allocation.
  return reserveSequentialPin(institutionId);
}

/**
 * Allocate a unique 4-digit attendance PIN for a student profile.
 * @param {object} institution Institution document (uses pinMode + nextSequentialPin)
 * @param {object} [opts]
 * @param {string} [opts.preferredPin] admin-specified PIN (validated for format + uniqueness)
 * @param {string|object} [opts.excludeProfileId] profile being re-assigned (its own PIN is ignored)
 */
async function allocatePin(institution, { preferredPin, excludeProfileId } = {}) {
  const institutionId = institution._id || institution.id;

  if (preferredPin) {
    if (!isValidPinFormat(preferredPin)) throw ApiError.badRequest('PIN must be a 4-digit number between 1000 and 9999');
    const available = await isPinAvailable(institutionId, preferredPin, excludeProfileId);
    if (!available) throw ApiError.conflict('That PIN is already assigned to another student in this institution', 'PIN_TAKEN');
    return String(preferredPin);
  }

  const mode = institution.pinMode === 'sequential' ? 'sequential' : 'auto';
  return mode === 'sequential' ? reserveSequentialPin(institutionId) : generateRandomPin(institutionId);
}

/** Look up a student by their PIN - used by the moderator "quick attendance" endpoint. */
async function findStudentByPin(institutionId, pin) {
  if (!isValidPinFormat(pin)) throw ApiError.badRequest('Invalid PIN format');
  return StudentProfile.findOne({ institutionId, assignedPin: String(pin) })
    .populate('userId', 'name phone status')
    .populate('batchId', 'name timing days');
}

/** Mask a PIN for list responses, e.g. 1234 -> "•••4". */
const maskPin = (pin) => (pin ? `•••${String(pin).slice(-1)}` : null);

module.exports = {
  isValidPinFormat,
  isPinAvailable,
  allocatePin,
  reserveSequentialPin,
  generateRandomPin,
  findStudentByPin,
  maskPin,
  PIN_MIN,
  PIN_MAX,
};
