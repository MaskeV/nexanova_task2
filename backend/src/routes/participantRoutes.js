// backend/src/routes/participantRoutes.js - FIXED
const express = require('express');
const router = express.Router();
const {
  createParticipant,
  getAllParticipants,
  getParticipantById,
  updateParticipant,
  deleteParticipant
} = require('../controllers/participantController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use((req, res, next) => {
  console.log(`👤 Participant Route: ${req.method} ${req.path}`);
  next();
});

// ✅ FIX: Allow authenticated users to READ participants
// But only ADMINS can CREATE, UPDATE, DELETE

// READ endpoints - Allow admin and evaluator
router.get('/', protect, getAllParticipants);
router.get('/:id', protect, getParticipantById);

// WRITE endpoints - Admin only
router.post('/', protect, authorize('admin'), createParticipant);
router.put('/:id', protect, authorize('admin'), updateParticipant);
router.delete('/:id', protect, authorize('admin'), deleteParticipant);

module.exports = router;