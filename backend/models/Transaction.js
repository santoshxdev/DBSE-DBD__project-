const mongoose = require('mongoose');

/**
 * Transaction Schema
 * Tracks book circulation (issues, returns, due dates, fines).
 */
const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    returnDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['ISSUED', 'RETURNED', 'OVERDUE'],
      default: 'ISSUED',
      index: true
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    RFIDEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFIDEvent',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast querying of active & overdue transactions
transactionSchema.index({ memberId: 1, status: 1 });
transactionSchema.index({ bookId: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
