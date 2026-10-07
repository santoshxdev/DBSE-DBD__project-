const mongoose = require('mongoose');

/**
 * Fine Schema
 * Represents financial penalties accrued due to overdue book returns.
 */
const fineSchema = new mongoose.Schema(
  {
    fineId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      default: 'Overdue book return'
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
      index: true
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Fine', fineSchema);
