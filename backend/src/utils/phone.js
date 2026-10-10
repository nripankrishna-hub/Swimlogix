/**
 * Normalise phone numbers to a digits-only canonical form so that the same person
 * always maps to one User record regardless of how they typed the number
 * (spaces, dashes, +, country code prefix are all stripped).
 */
function normalizePhone(input) {
  if (!input) return '';
  let digits = String(input).replace(/\D/g, '');
  // Drop a leading international "00" prefix.
  if (digits.startsWith('00')) digits = digits.slice(2);
  return digits;
}

/** Very permissive E.164-ish check (10-15 digits). */
function isValidPhone(input) {
  const digits = normalizePhone(input);
  return digits.length >= 10 && digits.length <= 15;
}

module.exports = { normalizePhone, isValidPhone };
