const router = require('express').Router();
const User = require('../models/User');
const Beneficiary = require('../models/Beneficiary');
const protect = require('../middleware/auth');
const { asyncHandler } = require('../utils/bank');

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await Beneficiary.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ items });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const accountNumber = String(req.body.accountNumber || '').trim();
    const nickname = String(req.body.nickname || '').trim().slice(0, 30);
    if (!accountNumber) return res.status(400).json({ message: 'Account number is required' });
    if (accountNumber === req.user.accountNumber)
      return res.status(400).json({ message: 'You cannot add your own account' });
    const target = await User.findOne({ accountNumber });
    if (!target) return res.status(404).json({ message: 'No account found with this number' });
    if (await Beneficiary.exists({ user: req.user._id, accountNumber }))
      return res.status(409).json({ message: 'This beneficiary is already saved' });
    const item = await Beneficiary.create({ user: req.user._id, name: target.name, accountNumber, nickname });
    res.status(201).json({ item });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Beneficiary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: 'Beneficiary not found' });
    res.json({ message: 'Beneficiary removed' });
  })
);

module.exports = router;
