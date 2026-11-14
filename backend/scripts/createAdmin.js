require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } =
      process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGODB_URI) {
      throw new Error('Please configure all admin environment variables.');
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error('Admin password must be at least 12 characters.');
    }

    await mongoose.connect(MONGODB_URI);

    const existingUser = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase()
    });

    if (existingUser) {
      throw new Error(
        'An account with this email already exists. No account was changed.'
      );
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin account created successfully!');
  } catch (error) {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();