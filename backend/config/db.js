const mongoose = require('mongoose');

/**
 * Initialize a MongoDB connection via Mongoose.
 * - Skips connection entirely when NODE_ENV === 'test' and MONGO_URI is missing.
 * - Exits the process on fatal connection errors (except in test).
 */

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('MONGO_URI is not defined');
      } else {
        console.log('Skipping MongoDB connection in test environment');
        return;
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Do not terminate the process while running tests
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
