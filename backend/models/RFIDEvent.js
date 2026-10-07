const mongoose = require('mongoose');

/**
 * RFID Event Log Schema
 * Captures real-time sensor triggers from ESP32 readers or web RFID simulators.
 */
const rfidEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    UID: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ['BOOK_SCAN', 'MEMBER_SCAN', 'ISSUE', 'RETURN', 'UNKNOWN_TAG'],
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      default: 'RFID_DEVICE_01',
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    processed: {
      type: Boolean,
      default: true
    },
    relatedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null
    },
    relatedMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RFIDEvent', rfidEventSchema);
