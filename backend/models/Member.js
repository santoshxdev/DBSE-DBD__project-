const mongoose = require('mongoose');

/**
 * Member / Student Schema
 * Represents library card holders. Connects to RFIDCardId for RFID integration.
 */
const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    RFIDCardId: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

// Search text index for fast keyword lookup
memberSchema.index({ name: 'text', studentId: 'text', email: 'text', department: 'text' });

module.exports = mongoose.model('Member', memberSchema);
