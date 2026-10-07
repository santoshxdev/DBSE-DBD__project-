const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Member = require('../models/Member');
const RFIDEvent = require('../models/RFIDEvent');
const Fine = require('../models/Fine');
const SystemSetting = require('../models/SystemSetting');
const { logAuditAction } = require('../services/auditService');

/**
 * Helper to fetch system configuration setting with fallback default
 */
const getSettingValue = async (key, defaultValue) => {
  try {
    const setting = await SystemSetting.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (err) {
    return defaultValue;
  }
};

/**
 * @desc    Issue a book to a member (Student)
 * @route   POST /api/transactions/issue
 * @access  Protected
 */
const issueBook = async (req, res, next) => {
  try {
    const { memberIdentifier, bookIdentifier } = req.body;

    if (!memberIdentifier || !bookIdentifier) {
      return res.status(400).json({
        success: false,
        error: 'Both Member Identifier (ID/RFID/Email) and Book Identifier (ID/ISBN/RFID) are required'
      });
    }

    const cleanMemberId = memberIdentifier.toString().trim();
    const cleanBookId = bookIdentifier.toString().trim();

    // 1. Identify Member
    const member = await Member.findOne({
      $or: [
        { _id: cleanMemberId.match(/^[0-9a-fA-F]{24}$/) ? cleanMemberId : null },
        { memberId: cleanMemberId },
        { studentId: cleanMemberId },
        { RFIDCardId: cleanMemberId.toUpperCase() },
        { email: cleanMemberId.toLowerCase() }
      ]
    });

    if (!member) {
      return res.status(404).json({ success: false, error: `Member '${cleanMemberId}' not found` });
    }

    if (member.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, error: `Member account '${member.name}' is ${member.status}` });
    }

    // 2. Check Member Borrowing Limit
    const maxBooksLimit = await getSettingValue('MAX_BOOKS_PER_MEMBER', parseInt(process.env.MAX_BOOKS_PER_MEMBER || '3', 10));
    const activeBorrowedCount = await Transaction.countDocuments({
      memberId: member._id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    });

    if (activeBorrowedCount >= maxBooksLimit) {
      return res.status(400).json({
        success: false,
        error: `Borrowing limit reached: ${member.name} already has ${activeBorrowedCount} active book(s) borrowed (Max limit: ${maxBooksLimit})`
      });
    }

    // 3. Identify Book
    const book = await Book.findOne({
      $or: [
        { _id: cleanBookId.match(/^[0-9a-fA-F]{24}$/) ? cleanBookId : null },
        { bookId: cleanBookId },
        { ISBN: cleanBookId },
        { RFIDTagId: cleanBookId.toUpperCase() }
      ]
    });

    if (!book) {
      return res.status(404).json({ success: false, error: `Book '${cleanBookId}' not found` });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        error: `Book '${book.title}' has no available copies for issuance`
      });
    }

    // 4. Check if member already borrowed this exact book
    const existingIssue = await Transaction.findOne({
      memberId: member._id,
      bookId: book._id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    });

    if (existingIssue) {
      return res.status(400).json({
        success: false,
        error: `Member ${member.name} has already borrowed copy of "${book.title}"`
      });
    }

    // 5. Calculate Due Date & Create Transaction
    const borrowingDays = await getSettingValue('BORROWING_DAYS', parseInt(process.env.BORROWING_DAYS || '14', 10));
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + borrowingDays);

    const txCount = await Transaction.countDocuments();
    const transactionId = `TXN-${10000 + txCount + 1}`;

    const transaction = await Transaction.create({
      transactionId,
      memberId: member._id,
      bookId: book._id,
      issueDate,
      dueDate,
      status: 'ISSUED',
      fineAmount: 0,
      issuedBy: req.user ? req.user._id : null
    });

    // 6. Update Book Copies Inventory
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    if (book.availableCopies === 0) {
      book.status = 'ISSUED';
    }
    await book.save();

    // 7. Log RFID Event
    const eventCount = await RFIDEvent.countDocuments();
    await RFIDEvent.create({
      eventId: `EVT-${10000 + eventCount + 1}`,
      UID: book.RFIDTagId || member.RFIDCardId || 'MANUAL_ISSUE',
      eventType: 'ISSUE',
      deviceId: req.body.deviceId || 'RFID_DEVICE_01',
      timestamp: issueDate,
      processed: true,
      relatedBook: book._id,
      relatedMember: member._id,
      transactionId: transaction._id
    });

    // 8. Log Audit Action
    await logAuditAction({
      userId: req.user ? req.user._id : null,
      action: 'ISSUE_BOOK',
      entityType: 'TRANSACTION',
      entityId: transaction.transactionId,
      description: `Issued book "${book.title}" (ID: ${book.bookId}) to member ${member.name} (${member.studentId}). Due date: ${dueDate.toISOString().split('T')[0]}`
    });

    // Populate transaction response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('memberId', 'name studentId email department RFIDCardId')
      .populate('bookId', 'title ISBN author shelfLocation RFIDTagId availableCopies totalCopies');

    res.status(201).json({
      success: true,
      message: `Book "${book.title}" issued successfully to ${member.name}`,
      data: populatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Return a borrowed book
 * @route   POST /api/transactions/return
 * @access  Protected
 */
const returnBook = async (req, res, next) => {
  try {
    const { bookIdentifier, transactionId } = req.body;

    if (!bookIdentifier && !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Book Identifier (ID/ISBN/RFID) or Transaction ID is required to process return'
      });
    }

    let transaction = null;

    if (transactionId) {
      transaction = await Transaction.findOne({
        $or: [
          { _id: transactionId.match(/^[0-9a-fA-F]{24}$/) ? transactionId : null },
          { transactionId: transactionId.trim() }
        ],
        status: { $in: ['ISSUED', 'OVERDUE'] }
      });
    }

    if (!transaction && bookIdentifier) {
      const cleanBookId = bookIdentifier.toString().trim();
      const book = await Book.findOne({
        $or: [
          { _id: cleanBookId.match(/^[0-9a-fA-F]{24}$/) ? cleanBookId : null },
          { bookId: cleanBookId },
          { ISBN: cleanBookId },
          { RFIDTagId: cleanBookId.toUpperCase() }
        ]
      });

      if (!book) {
        return res.status(404).json({ success: false, error: `Book '${cleanBookId}' not found` });
      }

      transaction = await Transaction.findOne({
        bookId: book._id,
        status: { $in: ['ISSUED', 'OVERDUE'] }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: `No active issue transaction found for book "${book.title}"`
        });
      }
    }

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Active borrowing transaction not found' });
    }

    const returnDate = new Date();
    const dailyFineRate = await getSettingValue('DAILY_FINE', parseInt(process.env.DAILY_FINE || '5', 10));

    // Calculate overdue days and fine amount
    let fineAmount = 0;
    let overdueDays = 0;
    const dueDate = new Date(transaction.dueDate);

    if (returnDate > dueDate) {
      const diffTime = returnDate.getTime() - dueDate.getTime();
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * dailyFineRate;
    }

    // Update Transaction Record
    transaction.returnDate = returnDate;
    transaction.status = 'RETURNED';
    transaction.fineAmount = fineAmount;
    transaction.returnedBy = req.user ? req.user._id : null;
    await transaction.save();

    // Create Fine Record if fine > 0
    let fineRecord = null;
    if (fineAmount > 0) {
      const fineCount = await Fine.countDocuments();
      fineRecord = await Fine.create({
        fineId: `FINE-${10000 + fineCount + 1}`,
        transactionId: transaction._id,
        memberId: transaction.memberId,
        amount: fineAmount,
        reason: `Returned ${overdueDays} day(s) overdue (₹${dailyFineRate}/day)`,
        status: 'PENDING'
      });
    }

    // Restore Book Available Copies
    const book = await Book.findById(transaction.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      book.status = 'AVAILABLE';
      await book.save();
    }

    // Record RFID Return Event
    const eventCount = await RFIDEvent.countDocuments();
    await RFIDEvent.create({
      eventId: `EVT-${10000 + eventCount + 1}`,
      UID: (book && book.RFIDTagId) || 'MANUAL_RETURN',
      eventType: 'RETURN',
      deviceId: req.body.deviceId || 'RFID_DEVICE_01',
      timestamp: returnDate,
      processed: true,
      relatedBook: book ? book._id : null,
      relatedMember: transaction.memberId,
      transactionId: transaction._id
    });

    // Record Audit Log
    await logAuditAction({
      userId: req.user ? req.user._id : null,
      action: 'RETURN_BOOK',
      entityType: 'TRANSACTION',
      entityId: transaction.transactionId,
      description: `Returned book "${book ? book.title : 'Unknown'}" (TXN: ${transaction.transactionId}). Fine accrued: ₹${fineAmount}`
    });

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('memberId', 'name studentId email department RFIDCardId')
      .populate('bookId', 'title ISBN author shelfLocation RFIDTagId availableCopies totalCopies');

    res.status(200).json({
      success: true,
      message: `Book "${book ? book.title : ''}" returned successfully.${fineAmount > 0 ? ` Overdue Fine: ₹${fineAmount}` : ''}`,
      data: {
        transaction: populatedTransaction,
        overdueDays,
        fineAmount,
        fineRecord
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions with search, pagination, and filter
 * @route   GET /api/transactions
 * @access  Protected
 */
const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { status, search, memberId, bookId } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (memberId) {
      query.memberId = memberId;
    }

    if (bookId) {
      query.bookId = bookId;
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('memberId', 'name studentId email department phone RFIDCardId')
      .populate('bookId', 'title ISBN author shelfLocation RFIDTagId')
      .populate('issuedBy', 'name role')
      .populate('returnedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active transactions (currently borrowed books)
 * @route   GET /api/transactions/active
 * @access  Protected
 */
const getActiveTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      status: { $in: ['ISSUED', 'OVERDUE'] }
    })
      .populate('memberId', 'name studentId email department phone RFIDCardId')
      .populate('bookId', 'title ISBN author shelfLocation RFIDTagId')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get overdue transactions with dynamically calculated live fines
 * @route   GET /api/transactions/overdue
 * @access  Protected
 */
const getOverdueTransactions = async (req, res, next) => {
  try {
    const now = new Date();
    const dailyFineRate = await getSettingValue('DAILY_FINE', parseInt(process.env.DAILY_FINE || '5', 10));

    // Update status of transactions whose dueDate has passed
    await Transaction.updateMany(
      { status: 'ISSUED', dueDate: { $lt: now } },
      { status: 'OVERDUE' }
    );

    const overdueTransactions = await Transaction.find({
      status: 'OVERDUE'
    })
      .populate('memberId', 'name studentId email department phone')
      .populate('bookId', 'title ISBN author shelfLocation')
      .sort({ dueDate: 1 });

    // Calculate dynamic estimated fine for each overdue item
    const dataWithFine = overdueTransactions.map((tx) => {
      const diffTime = now.getTime() - new Date(tx.dueDate).getTime();
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedFine = overdueDays * dailyFineRate;

      return {
        ...tx.toObject(),
        overdueDays,
        calculatedFine
      };
    });

    res.status(200).json({
      success: true,
      count: dataWithFine.length,
      data: dataWithFine
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Protected
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('memberId')
      .populate('bookId')
      .populate('issuedBy', 'name role')
      .populate('returnedBy', 'name role');

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueBook,
  returnBook,
  getTransactions,
  getActiveTransactions,
  getOverdueTransactions,
  getTransactionById
};
