const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    accountNumber: { type: String, required: true },
    nickname: { type: String, default: '', maxlength: 30 },
  },
  { timestamps: true }
);

beneficiarySchema.index({ user: 1, accountNumber: 1 }, { unique: true });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
