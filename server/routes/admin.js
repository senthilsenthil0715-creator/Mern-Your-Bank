const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Beneficiary = require('../models/Beneficiary');
const Loan = require('../models/Loan');
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { asyncHandler, parseAmount, round2, genRef } = require('../utils/bank');

router.use(protect, adminOnly);

const escapeRx = (s) => new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
const paging = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  return { page, limit };
};

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [customers, suspended, balAgg, txCount, activeLoans, newest] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ status: 'suspended' }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      Transaction.countDocuments(),
      Loan.find({ status: 'active' }).lean(),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password').lean(),
    ]);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ date: d, label: d.toLocaleDateString('en-US', { weekday: 'short' }), volume: 0, count: 0 });
    }
    const txs = await Transaction.find({ createdAt: { $gte: days[0].date }, type: { $ne: 'transfer_in' } }).lean();
    for (const t of txs) {
      const idx = days.findIndex((d, i) => new Date(t.createdAt) >= d.date && (i === 6 || new Date(t.createdAt) < days[i + 1].date));
      if (idx >= 0) {
        days[idx].volume += t.amount;
        days[idx].count += 1;
      }
    }

    res.json({
      customers,
      suspended,
      totalDeposits: round2(balAgg[0]?.total || 0),
      txCount,
      activeLoans: activeLoans.length,
      loanOutstanding: round2(activeLoans.reduce((s, l) => s + Math.max(l.totalPayable - l.paidEmis * l.emi, 0), 0)),
      chart: days.map((d) => ({ day: d.label, volume: round2(d.volume), count: d.count })),
      newest,
    });
  })
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { page, limit } = paging(req);
    const q = {};
    if (req.query.search) {
      const rx = escapeRx(req.query.search);
      q.$or = [{ name: rx }, { email: rx }, { accountNumber: rx }];
    }
    const total = await User.countDocuments(q);
    const items = await User.find(q)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const [transactions, loans] = await Promise.all([
      Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(8).lean(),
      Loan.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
    ]);
    res.json({ user, transactions, loans });
  })
);

router.patch(
  '/users/:id/status',
  asyncHandler(async (req, res) => {
    const status = req.body.status;
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (String(target._id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot suspend your own account' });
    if (target.role === 'admin') return res.status(400).json({ message: 'Remove admin role before suspending this account' });
    target.status = status;
    await target.save();
    res.json({ message: status === 'suspended' ? 'Account suspended' : 'Account reactivated', status });
  })
);

router.patch(
  '/users/:id/role',
  asyncHandler(async (req, res) => {
    const role = req.body.role;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (String(target._id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot change your own role' });
    target.role = role;
    await target.save();
    res.json({ message: role === 'admin' ? 'User is now an admin' : 'Admin rights removed', role });
  })
);

router.post(
  '/users/:id/adjust',
  asyncHandler(async (req, res) => {
    const amount = parseAmount(req.body.amount);
    const direction = req.body.direction;
    const reason = String(req.body.reason || '').trim().slice(0, 80);
    if (!amount) return res.status(400).json({ message: 'Enter a valid amount between 0.01 and 10,00,000' });
    if (!['credit', 'debit'].includes(direction)) return res.status(400).json({ message: 'Choose credit or debit' });
    if (!reason) return res.status(400).json({ message: 'A reason is required for balance adjustments' });

    const filter = { _id: req.params.id };
    if (direction === 'debit') filter.balance = { $gte: amount };
    const user = await User.findOneAndUpdate(filter, { $inc: { balance: direction === 'credit' ? amount : -amount } }, { new: true });
    if (!user) return res.status(400).json({ message: direction === 'debit' ? 'User not found or insufficient balance' : 'User not found' });

    await Transaction.create({
      user: user._id,
      type: direction === 'credit' ? 'deposit' : 'withdraw',
      amount,
      balanceAfter: round2(user.balance),
      description: `Admin adjustment: ${reason}`,
      category: 'Admin',
      reference: genRef(),
    });
    res.json({ message: `Account ${direction === 'credit' ? 'credited' : 'debited'}`, balance: user.balance });
  })
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (String(target._id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot delete your own account' });
    if (target.role === 'admin') return res.status(400).json({ message: 'Remove admin role before deleting this account' });
    await Promise.all([
      Transaction.deleteMany({ user: target._id }),
      Beneficiary.deleteMany({ $or: [{ user: target._id }, { accountNumber: target.accountNumber }] }),
      Loan.deleteMany({ user: target._id }),
    ]);
    await target.deleteOne();
    res.json({ message: 'User and related data deleted' });
  })
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const { page, limit } = paging(req);
    const q = {};
    if (req.query.type) q.type = req.query.type;
    if (req.query.search) {
      const rx = escapeRx(req.query.search);
      const users = await User.find({ $or: [{ name: rx }, { email: rx }, { accountNumber: rx }] }).select('_id').lean();
      q.$or = [{ reference: rx }, { description: rx }, { counterparty: rx }, { user: { $in: users.map((u) => u._id) } }];
    }
    const total = await Transaction.countDocuments(q);
    const items = await Transaction.find(q)
      .populate('user', 'name email accountNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

router.get(
  '/loans',
  asyncHandler(async (req, res) => {
    const loans = await Loan.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200).lean();
    res.json({
      items: loans.map((l) => ({ ...l, outstanding: Math.max(round2(l.totalPayable - l.paidEmis * l.emi), 0) })),
    });
  })
);

module.exports = router;
