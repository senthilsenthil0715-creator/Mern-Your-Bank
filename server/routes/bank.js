const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const protect = require('../middleware/auth');
const { asyncHandler, parseAmount, round2, genRef } = require('../utils/bank');

router.use(protect);

const CREDIT = ['deposit', 'transfer_in', 'loan_credit'];
const DEBIT = ['withdraw', 'transfer_out', 'bill', 'loan_payment'];
const AMOUNT_MSG = 'Enter a valid amount between 0.01 and 10,00,000';

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const txs = await Transaction.find({ user: req.user._id, createdAt: { $gte: start } }).lean();

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString('en-US', { month: 'short' }),
        income: 0,
        expense: 0,
      });
    }
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let income30 = 0;
    let expense30 = 0;
    for (const t of txs) {
      const d = new Date(t.createdAt);
      const credit = CREDIT.includes(t.type);
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) {
        if (credit) m.income += t.amount;
        else m.expense += t.amount;
      }
      if (d >= since) {
        if (credit) income30 += t.amount;
        else expense30 += t.amount;
      }
    }
    const recent = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(6).lean();
    res.json({
      balance: req.user.balance,
      income30: round2(income30),
      expense30: round2(expense30),
      chart: months.map((m) => ({ month: m.month, income: round2(m.income), expense: round2(m.expense) })),
      recent,
    });
  })
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 500);
    const q = { user: req.user._id };
    const { kind, search } = req.query;
    if (kind === 'credit') q.type = { $in: CREDIT };
    else if (kind === 'debit') q.type = { $in: DEBIT };
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      q.$or = [{ description: rx }, { counterparty: rx }, { reference: rx }, { category: rx }];
    }
    const total = await Transaction.countDocuments(q);
    const items = await Transaction.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

router.post(
  '/deposit',
  asyncHandler(async (req, res) => {
    const amount = parseAmount(req.body.amount);
    if (!amount) return res.status(400).json({ message: AMOUNT_MSG });
    const note = String(req.body.note || '').slice(0, 100);
    const user = await User.findByIdAndUpdate(req.user._id, { $inc: { balance: amount } }, { new: true });
    const transaction = await Transaction.create({
      user: user._id,
      type: 'deposit',
      amount,
      balanceAfter: round2(user.balance),
      description: note || 'Cash deposit',
      category: 'Deposit',
      reference: genRef(),
    });
    res.json({ message: 'Deposit successful', balance: user.balance, transaction });
  })
);

router.post(
  '/withdraw',
  asyncHandler(async (req, res) => {
    const amount = parseAmount(req.body.amount);
    if (!amount) return res.status(400).json({ message: AMOUNT_MSG });
    const note = String(req.body.note || '').slice(0, 100);
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );
    if (!user) return res.status(400).json({ message: 'Insufficient balance' });
    const transaction = await Transaction.create({
      user: user._id,
      type: 'withdraw',
      amount,
      balanceAfter: round2(user.balance),
      description: note || 'Cash withdrawal',
      category: 'Withdrawal',
      reference: genRef(),
    });
    res.json({ message: 'Withdrawal successful', balance: user.balance, transaction });
  })
);

router.get(
  '/lookup/:acc',
  asyncHandler(async (req, res) => {
    const u = await User.findOne({ accountNumber: String(req.params.acc) }).select('name accountNumber');
    if (!u) return res.status(404).json({ message: 'No account found with this number' });
    res.json({ name: u.name, accountNumber: u.accountNumber });
  })
);

router.post(
  '/transfer',
  asyncHandler(async (req, res) => {
    const amount = parseAmount(req.body.amount);
    const acc = String(req.body.accountNumber || '').trim();
    const note = String(req.body.note || '').slice(0, 100);
    if (!amount) return res.status(400).json({ message: AMOUNT_MSG });
    if (!acc) return res.status(400).json({ message: 'Receiver account number is required' });
    if (acc === req.user.accountNumber)
      return res.status(400).json({ message: 'You cannot transfer to your own account' });

    const receiver = await User.findOne({ accountNumber: acc });
    if (!receiver) return res.status(404).json({ message: 'Receiver account not found' });

    const sender = await User.findOneAndUpdate(
      { _id: req.user._id, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );
    if (!sender) return res.status(400).json({ message: 'Insufficient balance' });

    let credited;
    try {
      credited = await User.findByIdAndUpdate(receiver._id, { $inc: { balance: amount } }, { new: true });
      if (!credited) throw new Error('Receiver missing');
    } catch (e) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { balance: amount } });
      return res.status(500).json({ message: 'Transfer failed, your money was returned' });
    }

    const reference = genRef();
    const transaction = await Transaction.create({
      user: sender._id,
      type: 'transfer_out',
      amount,
      balanceAfter: round2(sender.balance),
      description: note || `Transfer to ${receiver.name}`,
      counterparty: receiver.name,
      category: 'Transfer',
      reference,
    });
    await Transaction.create({
      user: receiver._id,
      type: 'transfer_in',
      amount,
      balanceAfter: round2(credited.balance),
      description: note || `Transfer from ${sender.name}`,
      counterparty: sender.name,
      category: 'Transfer',
      reference,
    });
    res.json({ message: 'Transfer successful', reference, balance: sender.balance, receiver: receiver.name, transaction });
  })
);

router.post(
  '/bills/pay',
  asyncHandler(async (req, res) => {
    const amount = parseAmount(req.body.amount);
    const biller = String(req.body.biller || '').trim();
    const category = String(req.body.category || 'Bill').trim();
    const consumerNumber = String(req.body.consumerNumber || '').trim();
    if (!biller || !consumerNumber)
      return res.status(400).json({ message: 'Choose a biller and enter the consumer number' });
    if (!amount) return res.status(400).json({ message: AMOUNT_MSG });

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );
    if (!user) return res.status(400).json({ message: 'Insufficient balance' });
    const transaction = await Transaction.create({
      user: user._id,
      type: 'bill',
      amount,
      balanceAfter: round2(user.balance),
      description: `${category} bill - ${consumerNumber}`,
      counterparty: biller,
      category,
      reference: genRef(),
    });
    res.json({ message: 'Bill paid successfully', balance: user.balance, transaction });
  })
);

module.exports = router;
