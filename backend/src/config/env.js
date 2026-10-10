require('dotenv').config();

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swimlogix',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-only-insecure-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 10),

  otp: {
    provider: process.env.OTP_PROVIDER || 'mock',
    length: toInt(process.env.OTP_LENGTH, 6),
    ttlMinutes: toInt(process.env.OTP_TTL_MINUTES, 10),
    maxAttempts: toInt(process.env.OTP_MAX_ATTEMPTS, 5),
    devExpose: toBool(process.env.OTP_DEV_EXPOSE, (process.env.NODE_ENV || 'development') !== 'production'),
    msg91: {
      authKey: process.env.MSG91_AUTH_KEY || '',
      templateId: process.env.MSG91_TEMPLATE_ID || '',
      senderId: process.env.MSG91_SENDER_ID || '',
    },
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'swimlogix',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  superAdmin: {
    name: process.env.SUPERADMIN_NAME || 'Platform Owner',
    phone: process.env.SUPERADMIN_PHONE || '9999999999',
    password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123',
  },
};

env.isProd = env.nodeEnv === 'production';
env.isTest = env.nodeEnv === 'test';

module.exports = env;
