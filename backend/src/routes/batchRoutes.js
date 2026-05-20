// backend/src/routes/batchRoutes.js
const express = require('express');
const router = express.Router();
const {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  addParticipantsToBatch,
  removeParticipantFromBatch
} = require('../controllers/BatchController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Logging middleware
router.use((req, res, next) => {
  console.log(`📦 Batch Route: ${req.method} ${req.path}`);
  next();
});

// Public routes
router.get('/', getAllBatches);
router.get('/:id', getBatchById);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createBatch);
router.put('/:id', protect, authorize('admin'), updateBatch);
router.delete('/:id', protect, authorize('admin'), deleteBatch);
router.post('/:id/participants', protect, authorize('admin'), addParticipantsToBatch);
router.delete('/:id/participants/:participantId', protect, authorize('admin'), removeParticipantFromBatch);

module.exports = router;