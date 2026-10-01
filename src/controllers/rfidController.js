const RFIDTag = require('../models/RFIDTag');
const RFIDEvent = require('../models/RFIDEvent');
const Book = require('../models/Book');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const { logAuditAction } = require('../services/auditService');

/**
 * @desc    Process RFID scan event from ESP32 reader or web simulator
 * @route   POST /api/rfid/scan
 * @access  Public / Hardware API
 */
const scanRFID = async (req, res, next) => {
  try {
    const { uid, deviceId = 'RFID_DEVICE_01' } = req.body;

    if (!uid) {
      return res.status(400).json({ success: false, error: 'RFID UID is required' });
    }

    const cleanUid = uid.toString().trim().toUpperCase();

    // Check if RFID tag exists in registry
    let rfidTag = await RFIDTag.findOne({ UID: cleanUid })
      .populate('assignedBook')
      .populate('assignedMember');

    const eventCount = await RFIDEvent.countDocuments();
    const eventId = `EVT-${10000 + eventCount + 1}`;

    let eventType = 'UNKNOWN_TAG';
    let relatedBook = null;
    let relatedMember = null;
    let payloadEntity = null;
    let activeTransaction = null;

    if (rfidTag) {
      rfidTag.lastScannedAt = new Date();
      await rfidTag.save();

      // Priority check based on assignment
      if (rfidTag.assignedEntity === 'MEMBER' || rfidTag.assignedMember) {
        eventType = 'MEMBER_SCAN';
        relatedMember = rfidTag.assignedMember._id || rfidTag.assignedMember;
        payloadEntity = rfidTag.assignedMember;
      } else if (rfidTag.assignedEntity === 'BOOK' || rfidTag.assignedBook) {
        eventType = 'BOOK_SCAN';
        relatedBook = rfidTag.assignedBook._id || rfidTag.assignedBook;
        payloadEntity = rfidTag.assignedBook;

        // Fetch active issue transaction for this book if any
        if (relatedBook) {
          activeTransaction = await Transaction.findOne({
            bookId: relatedBook,
            status: { $in: ['ISSUED', 'OVERDUE'] }
          }).populate('memberId', 'name studentId department email RFIDCardId');
        }
      }
    } else {
      // Secondary lookup directly on Book/Member schemas if tag was typed manually
      const bookDirect = await Book.findOne({ RFIDTagId: cleanUid });
      if (bookDirect) {
        eventType = 'BOOK_SCAN';
        relatedBook = bookDirect._id;
        payloadEntity = bookDirect;
        activeTransaction = await Transaction.findOne({
          bookId: bookDirect._id,
          status: { $in: ['ISSUED', 'OVERDUE'] }
        }).populate('memberId', 'name studentId department email RFIDCardId');
      } else {
        const memberDirect = await Member.findOne({ RFIDCardId: cleanUid });
        if (memberDirect) {
          eventType = 'MEMBER_SCAN';
          relatedMember = memberDirect._id;
          payloadEntity = memberDirect;
        }
      }
    }

    // Create RFID event log entry
    const rfidEvent = await RFIDEvent.create({
      eventId,
      UID: cleanUid,
      eventType,
      deviceId,
      timestamp: new Date(),
      processed: true,
      relatedBook,
      relatedMember
    });

    res.status(200).json({
      success: true,
      scanResult: {
        uid: cleanUid,
        type: eventType === 'MEMBER_SCAN' ? 'MEMBER' : eventType === 'BOOK_SCAN' ? 'BOOK' : 'UNKNOWN',
        eventType,
        deviceId,
        timestamp: rfidEvent.timestamp,
        entity: payloadEntity,
        activeTransaction,
        event: rfidEvent
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get RFID Scan Event History
 * @route   GET /api/rfid/events
 * @access  Protected
 */
const getEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { eventType, search } = req.query;
    const query = {};

    if (eventType) {
      query.eventType = eventType;
    }

    if (search) {
      query.$or = [
        { UID: { $regex: search, $options: 'i' } },
        { eventId: { $regex: search, $options: 'i' } },
        { deviceId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await RFIDEvent.countDocuments(query);
    const events = await RFIDEvent.find(query)
      .populate('relatedBook', 'title ISBN bookId')
      .populate('relatedMember', 'name studentId department memberId')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: events
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered RFID Tags
 * @route   GET /api/rfid/tags
 * @access  Protected
 */
const getTags = async (req, res, next) => {
  try {
    const tags = await RFIDTag.find()
      .populate('assignedBook', 'title ISBN bookId')
      .populate('assignedMember', 'name studentId department memberId')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register new RFID Tag
 * @route   POST /api/rfid/tags
 * @access  Protected
 */
const createTag = async (req, res, next) => {
  try {
    const { UID, tagType, assignedEntity, bookId, memberId } = req.body;

    const cleanUid = UID.trim().toUpperCase();

    const existingTag = await RFIDTag.findOne({ UID: cleanUid });
    if (existingTag) {
      return res.status(400).json({ success: false, error: `RFID UID ${cleanUid} is already registered` });
    }

    const tagCount = await RFIDTag.countDocuments();
    const tagId = `TAG-${1000 + tagCount + 1}`;

    const tag = await RFIDTag.create({
      tagId,
      UID: cleanUid,
      tagType: tagType || 'BOOK_TAG',
      assignedEntity: assignedEntity || 'NONE',
      assignedBook: bookId || null,
      assignedMember: memberId || null,
      status: 'ACTIVE'
    });

    if (assignedEntity === 'BOOK' && bookId) {
      await Book.findByIdAndUpdate(bookId, { RFIDTagId: cleanUid });
    } else if (assignedEntity === 'MEMBER' && memberId) {
      await Member.findByIdAndUpdate(memberId, { RFIDCardId: cleanUid });
    }

    await logAuditAction({
      userId: req.user._id,
      action: 'CREATE_RFID_TAG',
      entityType: 'RFID_TAG',
      entityId: tag.tagId,
      description: `Registered new RFID Tag UID: ${cleanUid}`
    });

    res.status(201).json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update RFID Tag
 * @route   PUT /api/rfid/tags/:id
 * @access  Protected
 */
const updateTag = async (req, res, next) => {
  try {
    const tag = await RFIDTag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!tag) {
      return res.status(404).json({ success: false, error: 'RFID Tag not found' });
    }

    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanRFID,
  getEvents,
  getTags,
  createTag,
  updateTag
};
