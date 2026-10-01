const AuditLog = require('../models/AuditLog');

/**
 * Audit Logging Service
 * Records system administrative operations for accountability & academic compliance.
 */
const logAuditAction = async ({ userId = null, action, entityType, entityId = null, description }) => {
  try {
    const logCount = await AuditLog.countDocuments();
    const logId = `LOG-${10000 + logCount + 1}`;

    await AuditLog.create({
      logId,
      userId,
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[Audit Log Service] Error recording audit log:', error.message);
  }
};

module.exports = { logAuditAction };
