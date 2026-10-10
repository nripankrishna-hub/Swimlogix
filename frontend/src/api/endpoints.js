import { api } from './client';

/* ------------------------------------ Auth ------------------------------------ */
export const authApi = {
  checkPhone: (phone) => api.post('/auth/check-phone', { phone }, { auth: false }),
  requestOtp: (phone, purpose = 'login') => api.post('/auth/otp/request', { phone, purpose }, { auth: false }),
  verifyOtp: (phone, otp) => api.post('/auth/otp/verify', { phone, otp }, { auth: false }),
  passwordLogin: (phone, password) => api.post('/auth/password/login', { phone, password }, { auth: false }),
  changePassword: (newPassword, currentPassword) =>
    api.post('/auth/change-password', { newPassword, currentPassword }),
  me: () => api.get('/auth/me'),
  registerDevice: (token) => api.post('/auth/fcm-token', { token }),
  unregisterDevice: (token) => api.del(`/auth/fcm-token?token=${encodeURIComponent(token)}`),
};

/* --------------------------------- SuperAdmin --------------------------------- */
export const superAdminApi = {
  stats: () => api.get('/superadmin/stats'),
  listInstitutions: (query) => api.get('/superadmin/institutions', { query }),
  getInstitution: (institutionId) => api.get(`/superadmin/institutions/${institutionId}`),
  createInstitution: (payload) => api.post('/superadmin/institutions', payload),
  updateInstitution: (institutionId, payload) => api.patch(`/superadmin/institutions/${institutionId}`, payload),
  addAdmin: (institutionId, payload) => api.post(`/superadmin/institutions/${institutionId}/admins`, payload),
  resetPassword: (userId) => api.post(`/superadmin/admins/${userId}/reset-password`),
  setUserStatus: (userId, status) => api.patch(`/superadmin/users/${userId}/status`, { status }),
};

/* ------------------------------------ Admin ----------------------------------- */
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  getProfile: () => api.get('/admin/profile'),
  setupProfile: (payload) => api.put('/admin/profile', payload),
  uploadLogo: (formData) => api.upload('/admin/profile/logo', formData),
  getRegistrationFields: () => api.get('/admin/registration-fields'),
  updateRegistrationFields: (fields) => api.put('/admin/registration-fields', { fields }),
  updatePinMode: (pinMode) => api.patch('/admin/settings/pin-mode', { pinMode }),

  listBatches: (query) => api.get('/admin/batches', { query }),
  getBatch: (batchId) => api.get(`/admin/batches/${batchId}`),
  createBatch: (payload) => api.post('/admin/batches', payload),
  updateBatch: (batchId, payload) => api.patch(`/admin/batches/${batchId}`, payload),
  deleteBatch: (batchId) => api.del(`/admin/batches/${batchId}`),
  assignCoach: (batchId, coachId) => api.patch(`/admin/batches/${batchId}/coach`, { coachId }),

  listStudents: (query) => api.get('/admin/students', { query }),
  listPendingStudents: (query) => api.get('/admin/students/pending', { query }),
  getStudent: (studentId) => api.get(`/admin/students/${studentId}`),
  deleteStudent: (studentId) => api.del(`/admin/students/${studentId}`),
  enrollStudent: (payload) => api.post('/admin/students/enroll', payload),
  approveStudent: (studentId, payload) => api.patch(`/admin/students/${studentId}/approve`, payload),
  rejectStudent: (studentId, reason) => api.patch(`/admin/students/${studentId}/reject`, { reason }),
  assignPin: (studentId, pin) => api.post(`/admin/students/${studentId}/assign-pin`, { pin }),
  assignBatch: (studentId, batchId) => api.patch(`/admin/students/${studentId}/batch`, { batchId }),
  updateFees: (studentId, payload) => api.patch(`/admin/students/${studentId}/fees`, payload),
  studentProgress: (studentId) => api.get(`/admin/monitoring/students/${studentId}/progress`),

  listModerators: (query) => api.get('/admin/moderators', { query }),
  createModerator: (payload) => api.post('/admin/moderators', payload),
  updateModerator: (userId, payload) => api.patch(`/admin/moderators/${userId}`, payload),
  resetModeratorPassword: (userId) => api.post(`/admin/moderators/${userId}/reset-password`),
  removeModerator: (userId) => api.del(`/admin/moderators/${userId}`),
  revokeModerator: (userId) => api.del(`/admin/moderators/${userId}/hard`),
  trueDeleteModerator: (userId) => api.del(`/admin/moderators/${userId}/true-delete`),
  promoteModerator: (studentUserId) => api.post('/admin/moderators/promote', { studentUserId }),

  sendNotification: (payload) => api.post('/admin/notifications', payload),
  listNotifications: (query) => api.get('/admin/notifications', { query }),

  attendanceLogs: (query) => api.get('/admin/monitoring/attendance', { query }),
  swimTestResults: (query) => api.get('/admin/monitoring/swim-tests', { query }),
  backfillAbsences: (daysBack) => api.post('/admin/monitoring/backfill-absences', { daysBack }),
};

/* ---------------------------------- Moderator --------------------------------- */
export const moderatorApi = {
  dashboard: () => api.get('/moderator/dashboard'),
  myBatches: () => api.get('/moderator/batches'),
  getSession: (batchId, date) => api.get('/moderator/attendance/session', { query: { batchId, date } }),
  getStudentByPin: (pin) => api.get(`/moderator/attendance/pin/${pin}`),
  markByPin: (payload) => api.post('/moderator/attendance/pin', payload),
  markSession: (payload) => api.post('/moderator/attendance/session', payload),
  createSwimTest: (payload) => api.post('/moderator/swim-tests', payload),
  listSwimTests: (query) => api.get('/moderator/swim-tests', { query }),
  studentProgress: (studentId) => api.get(`/moderator/students/${studentId}/progress`),
  addMilestone: (studentId, payload) => api.post(`/moderator/students/${studentId}/milestones`, payload),
  sendAnnouncement: (payload) => api.post('/moderator/announcements', payload),
};

/* ---------------------------------- Student ----------------------------------- */
export const studentApi = {
  previewInstitution: (code) => api.get('/students/institution-preview', { query: { code } }),
  linkInstitution: (institutionCode) => api.post('/students/link-institution', { institutionCode }),
  changeInstitution: (institutionCode) => api.patch('/students/institution', { institutionCode }),
  getRegistrationForm: () => api.get('/students/registration-form'),
  submitRegistration: (data, name) => api.post('/students/registration', { data, name }),
  updateProfile: (payload) => api.patch('/students/profile', payload),
  addFamilyMember: (payload) => api.post('/students/family-members', payload),
  updateFamilyMember: (memberId, payload) => api.patch(`/students/family-members/${memberId}`, payload),
  removeFamilyMember: (memberId) => api.del(`/students/family-members/${memberId}`),
  dashboard: () => api.get('/students/dashboard'),
  progress: (query) => api.get('/students/progress', { query }),
  fees: () => api.get('/students/fees'),
  schedule: () => api.get('/students/schedule'),
  notifications: (query) => api.get('/students/notifications', { query }),
  markRead: (notificationId) => api.post(`/students/notifications/${notificationId}/read`),
};

