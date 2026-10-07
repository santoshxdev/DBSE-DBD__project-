const mongoose = require('mongoose');

/**
 * RFID Tag Registry Schema
 * Maps physical RFID UID chips to assigned entity (Book or Student Member).
 */
const rfidTagSchema = new mongoose.Schema(
  {
    tagId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    UID: {
      type: String,
      required: [true, 'RFID UID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    tagType: {
      type: String,
      enum: ['MEMBER_CARD', 'BOOK_TAG'],
      required: true
    },
    assignedEntity: {
      type: String,
      enum: ['BOOK', 'MEMBER', 'NONE'],
      default: 'NONE'
    },
    assignedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null
    },
    assignedMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'LOST'],
      default: 'ACTIVE'
    },
    lastScannedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RFIDTag', rfidTagSchema);
