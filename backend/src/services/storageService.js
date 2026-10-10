const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const LOCAL_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
const EXT_BY_MIME = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/webp': '.webp' };

let cloudinaryClient = null;
function getCloudinary() {
  if (cloudinaryClient) return cloudinaryClient;
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) return null;
  // Lazy require so the dependency is optional at runtime.
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  cloudinaryClient = cloudinary;
  return cloudinaryClient;
}

function uploadToCloudinary(buffer, folder) {
  const client = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      { folder: `${env.cloudinary.folder}/${folder}`, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id })),
    );
    stream.end(buffer);
  });
}

async function uploadToLocal(buffer, folder, mimetype) {
  await fs.mkdir(path.join(LOCAL_DIR, folder), { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT_BY_MIME[mimetype] || '.png'}`;
  const relative = `${folder}/${filename}`;
  await fs.writeFile(path.join(LOCAL_DIR, relative), buffer);
  return { url: `/uploads/${relative}`, publicId: `local:${relative}` };
}

/**
 * Upload an image buffer and return a public URL.
 * Uses Cloudinary when configured, otherwise the local `/uploads` folder (dev).
 * @param {Buffer} buffer
 * @param {{ folder?: string, mimetype?: string, baseUrl?: string }} [opts]
 */
async function uploadImage(buffer, opts = {}) {
  const { folder = 'misc', mimetype = 'image/png', baseUrl = '' } = opts;
  if (!buffer || !buffer.length) throw ApiError.badRequest('Empty file received');

  if (getCloudinary()) {
    try {
      const result = await uploadToCloudinary(buffer, folder);
      return result;
    } catch (err) {
      logger.error('Cloudinary upload failed, falling back to local storage', err.message);
    }
  }

  const local = await uploadToLocal(buffer, folder, mimetype);
  return { ...local, url: `${baseUrl}${local.url}` };
}

/** Best-effort delete (ignores failures so it never blocks the request). */
async function destroyImage(publicId) {
  if (!publicId) return;
  try {
    if (publicId.startsWith('local:')) {
      await fs.unlink(path.join(LOCAL_DIR, publicId.replace('local:', '')));
    } else {
      const client = getCloudinary();
      if (client) await client.uploader.destroy(publicId);
    }
  } catch (err) {
    logger.warn('Media cleanup failed:', err.message);
  }
}

module.exports = { uploadImage, destroyImage };
