import * as Yup from 'yup';

export const phoneSchema = Yup.string()
  .required('Mobile number is required')
  .matches(/^[+]?[\d\s-]{10,17}$/, 'Enter a valid mobile number');

export const passwordSchema = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(/[A-Za-z]/, 'Include at least one letter')
  .matches(/\d/, 'Include at least one number');

export const loginSchema = Yup.object({
  phone: phoneSchema,
  password: Yup.string().required('Password is required'),
});

export const otpRequestSchema = Yup.object({ phone: phoneSchema });

export const otpSchema = Yup.object({
  otp: Yup.string().required('Enter the OTP').matches(/^\d{4,8}$/, 'OTP must be 4-8 digits'),
});

export const changePasswordSchema = Yup.object({
  currentPassword: Yup.string().when('$forced', {
    is: true,
    then: (s) => s.notRequired(),
    otherwise: (s) => s.required('Current password is required'),
  }),
  newPassword: passwordSchema,
  confirmPassword: Yup.string()
    .required('Confirm your new password')
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match'),
});

export const institutionCodeSchema = Yup.object({
  institutionCode: Yup.string()
    .required('Institution code is required')
    .min(4, 'Institution codes are at least 4 characters')
    .max(12, 'Institution codes are at most 12 characters'),
});

export const batchSchema = Yup.object({
  name: Yup.string().required('Batch name is required'),
  level: Yup.string().required('Select a level'),
  capacity: Yup.number().typeError('Capacity must be a number').min(1, 'At least 1').max(500, 'Too large'),
  startTime: Yup.string().required('Start time is required (HH:mm)'),
  endTime: Yup.string().required('End time is required (HH:mm)'),
});

export const swimTestSchema = Yup.object({
  testName: Yup.string().required('Test name is required'),
  marks: Yup.number().typeError('Marks must be a number').min(0, 'Cannot be negative').required('Marks are required'),
  maxMarks: Yup.number().typeError('Max marks must be a number').min(1, 'Must be at least 1'),
  remarks: Yup.string(),
});

export const moderatorSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  phone: phoneSchema,
  password: Yup.string().required('Password is required').min(6, 'At least 6 characters'),
});

export const institutionProfileSchema = Yup.object({
  name: Yup.string().required('Institution name is required'),
  city: Yup.string(),
  state: Yup.string(),
  country: Yup.string(),
  policy: Yup.string(),
  contactPhone: phoneSchema.notRequired(),
  contactEmail: Yup.string().email('Enter a valid email'),
});

export const notificationSchema = Yup.object({
  title: Yup.string().required('Title is required').max(160),
  body: Yup.string().required('Message is required').max(2000),
});

export const createInstitutionSchema = Yup.object({
  name: Yup.string().required('Institution name is required'),
  adminName: Yup.string().required('Admin name is required'),
  adminPhone: phoneSchema,
  subscriptionValidity: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  maxStudents: Yup.number().typeError('Must be a number').min(1),
  maxModerators: Yup.number().typeError('Must be a number').min(1),
  maxBatches: Yup.number().typeError('Must be a number').min(1),
});
