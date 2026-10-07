const express = require('express');
const router = express.Router();
const {
  getStats,
  getRecentTransactions,
  getRFIDActivity
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getStats);
router.get('/recent-transactions', getRecentTransactions);
router.get('/rfid-activity', getRFIDActivity);

module.exports = router;
