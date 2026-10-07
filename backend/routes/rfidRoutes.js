const express = require('express');
const router = express.Router();
const {
  scanRFID,
  getEvents,
  getTags,
  createTag,
  updateTag
} = require('../controllers/rfidController');
const { protect, authorize } = require('../middleware/auth');

// Hardware endpoint (ESP32 or Simulator)
router.post('/scan', scanRFID);

// Dashboard management endpoints
router.get('/events', protect, getEvents);
router.get('/tags', protect, getTags);
router.post('/tags', protect, authorize('ADMIN', 'LIBRARIAN'), createTag);
router.put('/tags/:id', protect, authorize('ADMIN', 'LIBRARIAN'), updateTag);

module.exports = router;
