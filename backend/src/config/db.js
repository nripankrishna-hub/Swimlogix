const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let mongoServer = null;

mongoose.set('strictQuery', true);

/**
 * Establish (or reuse) the single shared MongoDB connection.
 * @param {string} [uri] optional override, defaults to env.mongoUri
 */
async function connectDB(uri = env.mongoUri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
    try {
      const fs = require('fs');
      const path = require('path');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      
      // Create a persistent directory for the database
      const dbPath = path.join(__dirname, '..', '..', 'data', 'db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
        logger.info(`Created persistent DB Directory at: ${dbPath}`);
      }

      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPath,
          storageEngine: 'wiredTiger', // This makes it persist to disk!
        }
      });
      uri = mongoServer.getUri();
      logger.info(`Started Portable MongoDB Server. Data is saved at: ${dbPath}`);
    } catch (err) {
      logger.warn('Could not start Portable MongoDB Server, falling back to uri: ' + err.message);
    }
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
    autoIndex: !env.isProd, // build indexes eagerly outside production
  });

  logger.info(`MongoDB connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = { connectDB, disconnectDB, mongoose };
