const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getMembers);
router.get('/:id', getMemberById);
router.post('/', authorize('ADMIN', 'LIBRARIAN'), createMember);
router.put('/:id', authorize('ADMIN', 'LIBRARIAN'), updateMember);
router.delete('/:id', authorize('ADMIN'), deleteMember);

module.exports = router;
