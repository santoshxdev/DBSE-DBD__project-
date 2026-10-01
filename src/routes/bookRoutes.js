const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getBooks);
router.get('/search', searchBooks);
router.get('/:id', getBookById);
router.post('/', authorize('ADMIN', 'LIBRARIAN'), createBook);
router.put('/:id', authorize('ADMIN', 'LIBRARIAN'), updateBook);
router.delete('/:id', authorize('ADMIN'), deleteBook);

module.exports = router;
