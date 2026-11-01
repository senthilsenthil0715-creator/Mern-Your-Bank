const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['Personal', 'Home', 'Car', 'Education'], required: true },
    principal: { type: Number, required: true },
    rate: { type: Number, required: true },
    months: { type: Number, required: true },
    emi: { type: Number, required: true },
    totalPayable: { type: Number, required: true },
    paidEmis: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
