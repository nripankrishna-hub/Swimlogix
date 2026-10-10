const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/db');
const app = require('./app');
const User = require('./models/User');
const { normalizePhone } = require('./utils/phone');

let server;

async function start() {
  await connectDB();

  if (env.mongoUri.includes('127.0.0.1') || env.mongoUri.includes('localhost')) {
    const phone = normalizePhone(env.superAdmin.phone);
    let user = await User.findOne({ phone, role: 'superadmin' });
    if (!user) {
      user = new User({
        name: env.superAdmin.name,
        phone,
        role: 'superadmin',
        status: 'active',
        isPasswordChanged: true,
        mustChangePassword: false,
      });
      await user.setPassword(env.superAdmin.password);
      await user.save();
      logger.info(`Seeded memory db with SuperAdmin -> ${phone} / ${env.superAdmin.password}`);
    }
  }

  server = app.listen(env.port, () => {
    logger.info(`SwimLogix API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

/** Graceful shutdown so in-flight requests finish and the DB connection closes cleanly. */
async function shutdown(signal) {
  logger.warn(`${signal} received, shutting down gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
