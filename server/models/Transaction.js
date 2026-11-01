const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdraw', 'transfer_out', 'transfer_in', 'bill', 'loan_credit', 'loan_payment'],
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, default: '' },
    counterparty: { type: String, default: '' },
    category: { type: String, default: '' },
    reference: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
