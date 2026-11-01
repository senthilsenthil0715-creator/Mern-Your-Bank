const User = require('../models/User');
const { genAccountNumber, genCard } = require('./bank');

module.exports = async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@yourbank.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Bank Admin',
      email,
      password,
      role: 'admin',
      accountNumber: await genAccountNumber(),
      card: genCard(),
      balance: 0,
    });
    console.log(`Admin account created: ${email}`);
  } else if (existing.role !== 'admin') {
    existing.role = 'admin';
    await existing.save();
    console.log(`Existing user promoted to admin: ${email}`);
  }
};
