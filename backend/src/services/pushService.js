const env = require('../config/env');
const logger = require('../utils/logger');

let messaging = null;

/** Lazily initialise firebase-admin; returns null when FCM is not configured (mock mode). */
function getMessaging() {
  if (messaging !== null) return messaging;
  if (!env.firebase.projectId || !env.firebase.clientEmail || !env.firebase.privateKey) {
    messaging = false; // mark as "not configured"
    return null;
  }
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
      });
    }
    messaging = admin.messaging();
    return messaging;
  } catch (err) {
    logger.error('FCM init failed, falling back to mock push:', err.message);
    messaging = false;
    return null;
  }
}

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Send a data/notification push to a set of FCM registration tokens.
 * Falls back to a console "mock" when Firebase credentials are absent (local dev / tests).
 * @returns {Promise<{provider: string, sent: number, failed: number}>}
 */
async function sendPush({ tokens = [], title, body, data = {} }) {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return { provider: 'none', sent: 0, failed: 0 };

  const client = getMessaging();
  if (!client) {
    logger.info(`[FCM:mock] ${unique.length} device(s) <- "${title}" :: ${body}`);
    return { provider: 'mock', sent: unique.length, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const group of chunk(unique, 500)) {
    // eslint-disable-next-line no-await-in-loop
    const result = await client.sendEachForMulticast({
      tokens: group,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high', notification: { channelId: 'default' } },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    sent += result.successCount;
    failed += result.failureCount;
  }

  return { provider: 'fcm', sent, failed };
}

/** Convenience wrapper: resolve a set of User documents and push to their tokens. */
async function sendPushToUsers(users, payload) {
  const tokens = users.flatMap((u) => u.fcmTokens || []);
  return sendPush({ ...payload, tokens });
}

module.exports = { sendPush, sendPushToUsers };
