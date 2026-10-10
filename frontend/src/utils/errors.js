/** Translate any thrown value into a user-facing message. */
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  return fallback;
};

/**
 * Convert an ApiError's `details` array into a Formik-compatible errors object:
 * [{ field: 'phone', message: 'Required' }] -> { phone: 'Required' }
 */
export const fieldErrors = (err) => {
  const out = {};
  const details = (err && err.details) || [];
  if (Array.isArray(details)) {
    details.forEach((d) => {
      if (d && d.field) out[d.field] = d.message;
    });
  }
  return out;
};

/** True when the backend demands a password change before proceeding. */
export const isPasswordChangeRequired = (err) => Boolean(err && err.code === 'PASSWORD_CHANGE_REQUIRED');

/** True when a record already exists / unique constraint was violated. */
export const isConflict = (err) => Boolean(err && (err.status === 409 || err.code === 'DUPLICATE_KEY'));

export default { errorMessage, fieldErrors, isPasswordChangeRequired, isConflict };
