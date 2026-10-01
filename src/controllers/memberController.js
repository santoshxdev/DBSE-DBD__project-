const Member = require('../models/Member');
const RFIDTag = require('../models/RFIDTag');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const { logAuditAction } = require('../services/auditService');

/**
 * @desc    Get all members with search, pagination, and filter
 * @route   GET /api/members
 * @access  Protected
 */
const getMembers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, department, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { RFIDCardId: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (status) {
      query.status = status;
    }

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: members.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: members
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single member details with active transactions & fines
 * @route   GET /api/members/:id
 * @access  Protected
 */
const getMemberById = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    // Active transactions
    const activeTransactions = await Transaction.find({
      memberId: member._id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    }).populate('bookId', 'title ISBN RFIDTagId author shelfLocation');

    // Pending fines
    const pendingFines = await Fine.find({
      memberId: member._id,
      status: 'PENDING'
    });

    const totalPendingFine = pendingFines.reduce((sum, f) => sum + f.amount, 0);

    res.status(200).json({
      success: true,
      data: member,
      activeTransactions,
      pendingFines,
      totalPendingFine
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new member (student)
 * @route   POST /api/members
 * @access  Protected
 */
const createMember = async (req, res, next) => {
  try {
    const { studentId, name, email, department, year, phone, RFIDCardId } = req.body;

    const existingStudentId = await Member.findOne({ studentId: studentId.trim() });
    if (existingStudentId) {
      return res.status(400).json({ success: false, error: `Student ID ${studentId} is already registered` });
    }

    const existingEmail = await Member.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ success: false, error: `Email ${email} is already in use` });
    }

    const count = await Member.countDocuments();
    const memberId = `MEM-${1000 + count + 1}`;

    const member = await Member.create({
      memberId,
      studentId: studentId.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      department: department.trim(),
      year: parseInt(year, 10),
      phone: phone.trim(),
      RFIDCardId: RFIDCardId ? RFIDCardId.trim().toUpperCase() : null,
      status: 'ACTIVE'
    });

    // Auto link RFID tag if supplied
    if (RFIDCardId) {
      const uidUpper = RFIDCardId.trim().toUpperCase();
      let rfidTag = await RFIDTag.findOne({ UID: uidUpper });
      if (!rfidTag) {
        const tagCount = await RFIDTag.countDocuments();
        rfidTag = await RFIDTag.create({
          tagId: `TAG-${1000 + tagCount + 1}`,
          UID: uidUpper,
          tagType: 'MEMBER_CARD',
          assignedEntity: 'MEMBER',
          assignedMember: member._id,
          status: 'ACTIVE'
        });
      } else {
        rfidTag.assignedEntity = 'MEMBER';
        rfidTag.assignedMember = member._id;
        rfidTag.tagType = 'MEMBER_CARD';
        await rfidTag.save();
      }
    }

    await logAuditAction({
      userId: req.user._id,
      action: 'CREATE_MEMBER',
      entityType: 'MEMBER',
      entityId: member.memberId,
      description: `Registered student ${member.name} (Student ID: ${member.studentId}, Dept: ${member.department})`
    });

    res.status(201).json({
      success: true,
      data: member
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member details
 * @route   PUT /api/members/:id
 * @access  Protected
 */
const updateMember = async (req, res, next) => {
  try {
    let member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const { RFIDCardId } = req.body;

    member = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update RFID tag assignment if changed
    if (RFIDCardId && RFIDCardId.toUpperCase() !== (member.RFIDCardId || '')) {
      const uidUpper = RFIDCardId.trim().toUpperCase();
      let rfidTag = await RFIDTag.findOne({ UID: uidUpper });
      if (!rfidTag) {
        const tagCount = await RFIDTag.countDocuments();
        await RFIDTag.create({
          tagId: `TAG-${1000 + tagCount + 1}`,
          UID: uidUpper,
          tagType: 'MEMBER_CARD',
          assignedEntity: 'MEMBER',
          assignedMember: member._id,
          status: 'ACTIVE'
        });
      } else {
        rfidTag.assignedEntity = 'MEMBER';
        rfidTag.assignedMember = member._id;
        rfidTag.tagType = 'MEMBER_CARD';
        await rfidTag.save();
      }
    }

    await logAuditAction({
      userId: req.user._id,
      action: 'UPDATE_MEMBER',
      entityType: 'MEMBER',
      entityId: member.memberId,
      description: `Updated member details for ${member.name} (${member.studentId})`
    });

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete member
 * @route   DELETE /api/members/:id
 * @access  Protected (Admin only)
 */
const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    // Check if member has active transactions
    const activeTxn = await Transaction.findOne({
      memberId: member._id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    });

    if (activeTxn) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete member who currently has borrowed books'
      });
    }

    if (member.RFIDCardId) {
      await RFIDTag.updateOne(
        { UID: member.RFIDCardId },
        { assignedEntity: 'NONE', assignedMember: null }
      );
    }

    await member.deleteOne();

    await logAuditAction({
      userId: req.user._id,
      action: 'DELETE_MEMBER',
      entityType: 'MEMBER',
      entityId: member.memberId,
      description: `Deleted member ${member.name} (${member.studentId})`
    });

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
};
