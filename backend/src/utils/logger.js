/* Tiny dependency-free logger with severity levels + timestamp. */
const stamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[${stamp()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[${stamp()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${stamp()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.log(`[${stamp()}] [DEBUG]`, ...args);
    }
  },
};

module.exports = logger;
