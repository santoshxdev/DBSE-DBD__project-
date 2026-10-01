const Book = require('../models/Book');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const RFIDEvent = require('../models/RFIDEvent');
const Fine = require('../models/Fine');

/**
 * @desc    Get complete dashboard summary statistics via MongoDB Aggregation Pipelines
 * @route   GET /api/dashboard/stats
 * @access  Protected
 */
const getStats = async (req, res, next) => {
  try {
    const totalBooksCount = await Book.countDocuments();
    const totalMembersCount = await Member.countDocuments();

    // Aggregation pipeline for book inventory copies
    const bookCopiesAgg = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' }
        }
      }
    ]);

    const totalCopies = bookCopiesAgg[0] ? bookCopiesAgg[0].totalCopies : 0;
    const availableCopies = bookCopiesAgg[0] ? bookCopiesAgg[0].availableCopies : 0;
    const borrowedCopies = totalCopies - availableCopies;

    // Transaction status counts
    const activeTransactionsCount = await Transaction.countDocuments({ status: 'ISSUED' });
    const overdueTransactionsCount = await Transaction.countDocuments({ status: 'OVERDUE' });
    const totalReturnedCount = await Transaction.countDocuments({ status: 'RETURNED' });

    // Fines total aggregation
    const pendingFinesAgg = await Fine.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const paidFinesAgg = await Fine.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingFines = pendingFinesAgg[0] ? pendingFinesAgg[0].total : 0;
    const paidFines = paidFinesAgg[0] ? paidFinesAgg[0].total : 0;

    // RFID scans today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rfidScansToday = await RFIDEvent.countDocuments({
      timestamp: { $gte: startOfDay }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalBooks: totalBooksCount,
        totalCopies,
        availableCopies,
        borrowedCopies,
        totalMembers: totalMembersCount,
        activeTransactions: activeTransactionsCount,
        overdueTransactions: overdueTransactionsCount,
        returnedTransactions: totalReturnedCount,
        pendingFines,
        paidFines,
        rfidScansToday
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent transactions list for dashboard table
 * @route   GET /api/dashboard/recent-transactions
 * @access  Protected
 */
const getRecentTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('memberId', 'name studentId department RFIDCardId')
      .populate('bookId', 'title ISBN author RFIDTagId')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent RFID activity stream
 * @route   GET /api/dashboard/rfid-activity
 * @access  Protected
 */
const getRFIDActivity = async (req, res, next) => {
  try {
    const events = await RFIDEvent.find()
      .populate('relatedBook', 'title ISBN')
      .populate('relatedMember', 'name studentId')
      .sort({ timestamp: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getRecentTransactions,
  getRFIDActivity
};
