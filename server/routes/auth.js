const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const protect = require('../middleware/auth');
const { asyncHandler, genAccountNumber, genCard, genRef } = require('../utils/bank');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => {
  const o = u.toObject ? u.toObject() : { ...u };
  delete o.password;
  return o;
};
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WELCOME_BONUS = 5000;

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim();
    const accountType = ['Savings', 'Current'].includes(req.body.accountType) ? req.body.accountType : 'Savings';

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (!emailRx.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists' });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      accountType,
      accountNumber: await genAccountNumber(),
      card: genCard(),
      balance: WELCOME_BONUS,
    });
    await Transaction.create({
      user: user._id,
      type: 'deposit',
      amount: WELCOME_BONUS,
      balanceAfter: WELCOME_BONUS,
      description: 'Welcome bonus',
      category: 'Bonus',
      reference: genRef(),
    });
    res.status(201).json({ token: sign(user._id), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Incorrect email or password' });
    if (user.status === 'suspended')
      return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
    res.json({ token: sign(user._id), user: publicUser(user) });
  })
);

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

router.put(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    if (!name) return res.status(400).json({ message: 'Name cannot be empty' });
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true }).select('-password');
    res.json({ user: publicUser(user) });
  })
);

router.put(
  '/password',
  protect,
  asyncHandler(async (req, res) => {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  })
);

module.exports = router;
