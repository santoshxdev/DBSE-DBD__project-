const express = require('express');
const router = express.Router();
const { getFines, payFine } = require('../controllers/fineController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getFines);
router.post('/:id/pay', authorize('ADMIN', 'LIBRARIAN'), payFine);

module.exports = router;
