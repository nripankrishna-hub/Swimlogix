const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/** In-memory upload (5 MB max) -> the storage service decides Cloudinary vs. local disk. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    return cb(ApiError.badRequest('Only PNG, JPG or WEBP images are allowed'));
  },
});

module.exports = { upload };
