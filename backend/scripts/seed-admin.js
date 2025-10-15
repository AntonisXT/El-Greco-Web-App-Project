require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;
const username = process.argv[2];
const password = process.argv[3];

// Basic usage check
if (!username || !password) {
  console.error('Usage: node scripts/seed-admin.js <username> <password>');
  process.exit(1);
}

(async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);

    // Hash provided password
    const hash = bcrypt.hashSync(password, 12);

    // Create or update admin user
    const existing = await User.findOne({ username });
    if (existing) {
      existing.passwordHash = hash;
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      console.log(`✅ Admin updated: ${username}`);
    } else {
      await User.create({ username, passwordHash: hash, role: 'admin' });
      console.log(`✅ Admin created: ${username}`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    // Close DB connection
    await mongoose.disconnect();
  }
})();
