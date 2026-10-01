const Book = require('../models/Book');
const RFIDTag = require('../models/RFIDTag');
const Transaction = require('../models/Transaction');
const { logAuditAction } = require('../services/auditService');

/**
 * @desc    Get all books with pagination, search, and category filtering
 * @route   GET /api/books
 * @access  Protected
 */
const getBooks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, category, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { ISBN: { $regex: search, $options: 'i' } },
        { bookId: { $regex: search, $options: 'i' } },
        { RFIDTagId: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: books
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single book details
 * @route   GET /api/books/:id
 * @access  Protected
 */
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Fetch active transaction if any
    const activeTransaction = await Transaction.findOne({
      bookId: book._id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    }).populate('memberId', 'name studentId department email RFIDCardId');

    res.status(200).json({
      success: true,
      data: book,
      activeTransaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new book
 * @route   POST /api/books
 * @access  Protected
 */
const createBook = async (req, res, next) => {
  try {
    const {
      ISBN,
      title,
      author,
      category,
      publisher,
      publicationYear,
      language,
      totalCopies,
      shelfLocation,
      RFIDTagId
    } = req.body;

    const existingISBN = await Book.findOne({ ISBN: ISBN.trim() });
    if (existingISBN) {
      return res.status(400).json({ success: false, error: `Book with ISBN ${ISBN} already exists` });
    }

    const count = await Book.countDocuments();
    const bookId = `BK-${1000 + count + 1}`;

    const numCopies = parseInt(totalCopies, 10) || 1;

    const book = await Book.create({
      bookId,
      ISBN: ISBN.trim(),
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      publisher: publisher ? publisher.trim() : '',
      publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
      language: language || 'English',
      totalCopies: numCopies,
      availableCopies: numCopies,
      shelfLocation: shelfLocation.trim(),
      RFIDTagId: RFIDTagId ? RFIDTagId.trim().toUpperCase() : null,
      status: numCopies > 0 ? 'AVAILABLE' : 'MAINTENANCE'
    });

    // If RFIDTagId is provided during creation, auto-link in RFIDTag collection
    if (RFIDTagId) {
      const uidUpper = RFIDTagId.trim().toUpperCase();
      let rfidTag = await RFIDTag.findOne({ UID: uidUpper });
      if (!rfidTag) {
        const tagCount = await RFIDTag.countDocuments();
        rfidTag = await RFIDTag.create({
          tagId: `TAG-${1000 + tagCount + 1}`,
          UID: uidUpper,
          tagType: 'BOOK_TAG',
          assignedEntity: 'BOOK',
          assignedBook: book._id,
          status: 'ACTIVE'
        });
      } else {
        rfidTag.assignedEntity = 'BOOK';
        rfidTag.assignedBook = book._id;
        rfidTag.tagType = 'BOOK_TAG';
        await rfidTag.save();
      }
    }

    await logAuditAction({
      userId: req.user._id,
      action: 'CREATE_BOOK',
      entityType: 'BOOK',
      entityId: book.bookId,
      description: `Added book "${book.title}" by ${book.author} (ISBN: ${book.ISBN})`
    });

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update book details
 * @route   PUT /api/books/:id
 * @access  Protected
 */
const updateBook = async (req, res, next) => {
  try {
    let book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const { RFIDTagId, totalCopies } = req.body;

    // Adjust available copies if total copies changed
    if (totalCopies !== undefined && totalCopies !== book.totalCopies) {
      const diff = parseInt(totalCopies, 10) - book.totalCopies;
      req.body.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update RFID tag assignment if changed
    if (RFIDTagId && RFIDTagId.toUpperCase() !== (book.RFIDTagId || '')) {
      const uidUpper = RFIDTagId.trim().toUpperCase();
      let rfidTag = await RFIDTag.findOne({ UID: uidUpper });
      if (!rfidTag) {
        const tagCount = await RFIDTag.countDocuments();
        await RFIDTag.create({
          tagId: `TAG-${1000 + tagCount + 1}`,
          UID: uidUpper,
          tagType: 'BOOK_TAG',
          assignedEntity: 'BOOK',
          assignedBook: book._id,
          status: 'ACTIVE'
        });
      } else {
        rfidTag.assignedEntity = 'BOOK';
        rfidTag.assignedBook = book._id;
        rfidTag.tagType = 'BOOK_TAG';
        await rfidTag.save();
      }
    }

    await logAuditAction({
      userId: req.user._id,
      action: 'UPDATE_BOOK',
      entityType: 'BOOK',
      entityId: book.bookId,
      description: `Updated book "${book.title}" (ID: ${book.bookId})`
    });

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a book
 * @route   DELETE /api/books/:id
 * @access  Protected (Admin only)
 */
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Check for active issued transactions
    const activeTxn = await Transaction.findOne({
      bookId: book._id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    });

    if (activeTxn) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete book that is currently issued to a member'
      });
    }

    // Unlink any associated RFID tag
    if (book.RFIDTagId) {
      await RFIDTag.updateOne(
        { UID: book.RFIDTagId },
        { assignedEntity: 'NONE', assignedBook: null }
      );
    }

    await book.deleteOne();

    await logAuditAction({
      userId: req.user._id,
      action: 'DELETE_BOOK',
      entityType: 'BOOK',
      entityId: book.bookId,
      description: `Deleted book "${book.title}" (ID: ${book.bookId})`
    });

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search books (autocomplete / fast query)
 * @route   GET /api/books/search
 * @access  Protected
 */
const searchBooks = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const books = await Book.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { ISBN: { $regex: q, $options: 'i' } },
        { RFIDTagId: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);

    res.status(200).json({
      success: true,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks
};
