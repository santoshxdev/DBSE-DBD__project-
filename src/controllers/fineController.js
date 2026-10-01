const Fine = require('../models/Fine');
const { logAuditAction } = require('../services/auditService');

/**
 * @desc    Get all fine records
 * @route   GET /api/fines
 * @access  Protected
 */
const getFines = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const total = await Fine.countDocuments(query);
    const fines = await Fine.find(query)
      .populate('memberId', 'name studentId department email phone')
      .populate({
        path: 'transactionId',
        populate: { path: 'bookId', select: 'title ISBN' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate aggregated pending and paid totals
    const pendingTotalResult = await Fine.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const paidTotalResult = await Fine.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPendingAmount = pendingTotalResult[0] ? pendingTotalResult[0].total : 0;
    const totalPaidAmount = paidTotalResult[0] ? paidTotalResult[0].total : 0;

    res.status(200).json({
      success: true,
      count: fines.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: {
        totalPendingAmount,
        totalPaidAmount
      },
      data: fines
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process Fine Payment
 * @route   POST /api/fines/:id/pay
 * @access  Protected
 */
const payFine = async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id).populate('memberId', 'name studentId');
    if (!fine) {
      return res.status(404).json({ success: false, error: 'Fine record not found' });
    }

    if (fine.status === 'PAID') {
      return res.status(400).json({ success: false, error: 'Fine has already been settled and paid' });
    }

    fine.status = 'PAID';
    fine.paidAt = new Date();
    await fine.save();

    await logAuditAction({
      userId: req.user._id,
      action: 'PAY_FINE',
      entityType: 'FINE',
      entityId: fine.fineId,
      description: `Collected fine payment of ₹${fine.amount} for member ${fine.memberId ? fine.memberId.name : 'Student'}`
    });

    res.status(200).json({
      success: true,
      message: `Fine of ₹${fine.amount} marked as PAID`,
      data: fine
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFines,
  payFine
};
