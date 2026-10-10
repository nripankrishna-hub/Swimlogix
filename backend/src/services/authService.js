const StudentProfile = require('../models/StudentProfile');
const { signAccessToken, signRefreshToken } = require('../utils/token');

/** Issue the JWT pair + a safe user payload. */
function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: user.toSafeJSON ? user.toSafeJSON() : user,
  };
}

/**
 * Decide which screen the mobile app should route to after authentication.
 * Drives the "Login & Role Routing" flow.
 */
async function resolveNextStep(user) {
  if (user.role === 'superadmin') return 'superadmin_dashboard';

  if (user.role === 'admin' || user.role === 'moderator') {
    return user.mustChangePassword && !user.isPasswordChanged
      ? 'change_password'
      : `${user.role}_dashboard`;
  }

  // Student / family member
  if (!user.institutionId) return 'link_institution';

  const profile = await StudentProfile.findOne({ userId: user._id }).select('approvalStatus');
  if (!profile || profile.approvalStatus === 'draft') return 'complete_registration';
  if (profile.approvalStatus === 'pending') return 'pending_approval';
  if (profile.approvalStatus === 'rejected') return 'registration_rejected';
  return 'student_dashboard';
}

module.exports = { issueTokens, resolveNextStep };
