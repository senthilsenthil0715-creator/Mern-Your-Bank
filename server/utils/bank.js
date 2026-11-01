const User = require('../models/User');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const parseAmount = (v) => {
  const n = round2(parseFloat(v));
  return Number.isFinite(n) && n > 0 && n <= 1000000 ? n : null;
};

const genRef = () =>
  'YB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

const digits = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');

async function genAccountNumber() {
  for (;;) {
    const n = '5' + digits(11);
    if (!(await User.exists({ accountNumber: n }))) return n;
  }
}

function genCard() {
  const year = String((new Date().getFullYear() + 5) % 100).padStart(2, '0');
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  return { number: '4' + digits(15), expiry: `${month}/${year}`, cvv: digits(3), frozen: false };
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { round2, parseAmount, genRef, genAccountNumber, genCard, asyncHandler };
