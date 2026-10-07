const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  getTransactions,
  getActiveTransactions,
  getOverdueTransactions,
  getTransactionById
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/issue', authorize('ADMIN', 'LIBRARIAN'), issueBook);
router.post('/return', authorize('ADMIN', 'LIBRARIAN'), returnBook);
router.get('/', getTransactions);
router.get('/active', getActiveTransactions);
router.get('/overdue', getOverdueTransactions);
router.get('/:id', getTransactionById);

module.exports = router;
