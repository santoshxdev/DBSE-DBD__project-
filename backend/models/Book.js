const mongoose = require('mongoose');

/**
 * Book Schema
 * Handles book catalog, RFID tag association, and available copy inventory tracking.
 */
const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    ISBN: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    publisher: {
      type: String,
      trim: true
    },
    publicationYear: {
      type: Number
    },
    language: {
      type: String,
      default: 'English'
    },
    totalCopies: {
      type: Number,
      required: true,
      min: [1, 'Total copies must be at least 1'],
      default: 1
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
      default: 1
    },
    shelfLocation: {
      type: String,
      required: true,
      trim: true
    },
    RFIDTagId: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ISSUED', 'MAINTENANCE'],
      default: 'AVAILABLE'
    }
  },
  {
    timestamps: true
  }
);

// Compound text index for catalog search
bookSchema.index({ title: 'text', author: 'text', category: 'text', ISBN: 'text' });

module.exports = mongoose.model('Book', bookSchema);
