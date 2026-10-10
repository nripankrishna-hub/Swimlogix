/* eslint-disable no-console */
/**
 * Bootstrap the platform SuperAdmin account.
 * Usage:  npm run seed:superadmin
 * Reads SUPERADMIN_NAME / SUPERADMIN_PHONE / SUPERADMIN_PASSWORD from the environment.
 */
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { normalizePhone } = require('../src/utils/phone');

async function run() {
  await connectDB();

  const phone = normalizePhone(env.superAdmin.phone);
  let user = await User.findOne({ phone, role: 'superadmin' });

  if (user) {
    await user.setPassword(env.superAdmin.password);
    user.name = env.superAdmin.name;
    user.isPasswordChanged = true;
    user.mustChangePassword = false;
    user.status = 'active';
    await user.save();
    console.log(`✔ SuperAdmin ${phone} updated (password reset to the value in your .env)`);
  } else {
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
    console.log(`✔ SuperAdmin created -> ${phone}`);
    console.log(`  Password: ${env.superAdmin.password}  (change it immediately in production)`);
  }

  await disconnectDB();
}

run().catch((err) => {
  console.error('✖ Seed failed:', err.message);
  process.exit(1);
});
