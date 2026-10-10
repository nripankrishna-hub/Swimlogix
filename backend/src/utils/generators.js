const crypto = require('crypto');

/** Cryptographically strong random integer in [min, max] (inclusive). */
function randomInt(min, max) {
  return crypto.randomInt(min, max + 1);
}

/** Pick a random character from a charset. */
function randomChar(charset) {
  return charset[randomInt(0, charset.length - 1)];
}

/** Build a random string from a charset. */
function randomString(length, charset) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += randomChar(charset);
  return out;
}

// Readable alphabets (ambiguous glyphs such as O/0 and I/1 are removed).
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '@#$%&*!?';

/**
 * Unique Institution Code shared with parents, e.g. "AQUA7K2".
 * @param {number} [length=6]
 */
function generateInstitutionCode(length = 6) {
  return randomString(length, CODE_CHARSET);
}

/**
 * 4-digit ATM style attendance PIN. Never starts the range guard - caller ensures uniqueness.
 * @param {{ min?: number, max?: number, length?: number }} [opts]
 */
function generatePin({ min = 1000, max = 9999, length = 4 } = {}) {
  if (length !== 4) {
    // general digit PIN (kept for future extensibility)
    let out = '';
    for (let i = 0; i < length; i += 1) out += DIGITS[randomInt(0, DIGITS.length - 1)];
    return out;
  }
  return String(randomInt(min, max));
}

/** Generate a secure 6-digit OTP (zero padded). */
function generateOtp(length = 6) {
  const digits = '0123456789';
  return randomString(length, digits);
}

/**
 * Human-transcribable temporary password for Admins/Moderators.
 * Guarantees at least 1 upper, 1 lower, 1 digit and 1 symbol.
 */
function generateTempPassword(length = 10) {
  const base = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SYMBOLS)];
  const rest = randomString(Math.max(length - base.length, 0), UPPER + LOWER + DIGITS + SYMBOLS);
  const combined = (base.join('') + rest).split('');
  // Fisher-Yates shuffle so the guaranteed chars are not always in front.
  for (let i = combined.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join('');
}

module.exports = {
  randomInt,
  randomString,
  CODE_CHARSET,
  generateInstitutionCode,
  generatePin,
  generateOtp,
  generateTempPassword,
};
