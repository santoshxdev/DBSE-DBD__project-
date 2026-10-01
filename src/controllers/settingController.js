const SystemSetting = require('../models/SystemSetting');
const { logAuditAction } = require('../services/auditService');

/**
 * @desc    Get all system configuration settings
 * @route   GET /api/settings
 * @access  Protected
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();
    
    // Default fallback object
    const configMap = {
      DAILY_FINE: 5,
      BORROWING_DAYS: 14,
      MAX_BOOKS_PER_MEMBER: 3,
      RFID_DEVICE_ID: 'RFID_DEVICE_01'
    };

    settings.forEach((s) => {
      configMap[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      data: configMap
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update system configuration settings
 * @route   PUT /api/settings
 * @access  Protected (Admin only)
 */
const updateSettings = async (req, res, next) => {
  try {
    const { DAILY_FINE, BORROWING_DAYS, MAX_BOOKS_PER_MEMBER, RFID_DEVICE_ID } = req.body;

    const updates = [
      { key: 'DAILY_FINE', value: parseInt(DAILY_FINE, 10) || 5, description: 'Daily overdue fine in ₹' },
      { key: 'BORROWING_DAYS', value: parseInt(BORROWING_DAYS, 10) || 14, description: 'Default borrowing allowance in days' },
      { key: 'MAX_BOOKS_PER_MEMBER', value: parseInt(MAX_BOOKS_PER_MEMBER, 10) || 3, description: 'Max allowed active borrowed books per member' },
      { key: 'RFID_DEVICE_ID', value: RFID_DEVICE_ID || 'RFID_DEVICE_01', description: 'Primary RFID hardware scanner identifier' }
    ];

    for (const update of updates) {
      await SystemSetting.findOneAndUpdate(
        { key: update.key },
        { value: update.value, description: update.description },
        { upsert: true, new: true }
      );
    }

    await logAuditAction({
      userId: req.user._id,
      action: 'UPDATE_SETTINGS',
      entityType: 'SYSTEM_SETTING',
      description: `Updated library settings: Fine=₹${DAILY_FINE}/day, Allowance=${BORROWING_DAYS} days, Max Limit=${MAX_BOOKS_PER_MEMBER}`
    });

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: { DAILY_FINE, BORROWING_DAYS, MAX_BOOKS_PER_MEMBER, RFID_DEVICE_ID }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
