const router = require('express').Router();
const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const protect = require('../middleware/auth');
const { asyncHandler, round2, genRef } = require('../utils/bank');

router.use(protect);

const RATES = { Personal: 11.5, Home: 8.5, Car: 9.5, Education: 7.5 };

const calcEmi = (principal, annualRate, months) => {
  const r = annualRate / 12 / 100;
  const f = Math.pow(1 + r, months);
  return round2((principal * r * f) / (f - 1));
};

const shape = (l) => {
  const o = l.toObject();
  o.outstanding = Math.max(round2(o.totalPayable - o.paidEmis * o.emi), 0);
  return o;
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const loans = await Loan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ items: loans.map(shape), rates: RATES });
  })
);

router.post(
  '/apply',
  asyncHandler(async (req, res) => {
    const type = String(req.body.type || '');
    const principal = round2(parseFloat(req.body.principal));
    const months = parseInt(req.body.months, 10);
    if (!RATES[type]) return res.status(400).json({ message: 'Choose a valid loan type' });
    if (!Number.isFinite(principal) || principal < 1000 || principal > 5000000)
      return res.status(400).json({ message: 'Loan amount must be between 1,000 and 50,00,000' });
    if (!Number.isInteger(months) || months < 3 || months > 360)
      return res.status(400).json({ message: 'Tenure must be between 3 and 360 months' });
    if ((await Loan.countDocuments({ user: req.user._id, status: 'active' })) >= 3)
      return res.status(400).json({ message: 'You can have at most 3 active loans' });

    const rate = RATES[type];
    const emi = calcEmi(principal, rate, months);
    const loan = await Loan.create({
      user: req.user._id,
      type,
      principal,
      rate,
      months,
      emi,
      totalPayable: round2(emi * months),
    });
    const user = await User.findByIdAndUpdate(req.user._id, { $inc: { balance: principal } }, { new: true });
    await Transaction.create({
      user: user._id,
      type: 'loan_credit',
      amount: principal,
      balanceAfter: round2(user.balance),
      description: `${type} loan disbursed`,
      category: 'Loan',
      reference: genRef(),
    });
    res.status(201).json({ message: 'Loan approved and credited to your account', loan: shape(loan), balance: user.balance });
  })
);

router.post(
  '/:id/pay',
  asyncHandler(async (req, res) => {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id, status: 'active' });
    if (!loan) return res.status(404).json({ message: 'Active loan not found' });

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, balance: { $gte: loan.emi } },
      { $inc: { balance: -loan.emi } },
      { new: true }
    );
    if (!user) return res.status(400).json({ message: 'Insufficient balance to pay this EMI' });

    loan.paidEmis += 1;
    if (loan.paidEmis >= loan.months) loan.status = 'closed';
    await loan.save();
    await Transaction.create({
      user: user._id,
      type: 'loan_payment',
      amount: loan.emi,
      balanceAfter: round2(user.balance),
      description: `${loan.type} loan EMI ${loan.paidEmis}/${loan.months}`,
      category: 'Loan',
      reference: genRef(),
    });
    res.json({ message: loan.status === 'closed' ? 'Final EMI paid. Loan closed!' : 'EMI paid successfully', loan: shape(loan), balance: user.balance });
  })
);

module.exports = router;
