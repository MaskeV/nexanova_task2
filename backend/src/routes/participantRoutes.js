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

// All routes admin only
router.use(protect, authorize('admin'));

router.get('/', getAllParticipants);
router.get('/:id', getParticipantById);
router.post('/', createParticipant);
router.put('/:id', updateParticipant);
router.delete('/:id', deleteParticipant);

module.exports = router;