const express = require('express');
const router = express.Router();
const {
  assignEvaluation,
  getMyEvaluations,
  submitEvaluation,
  getEvaluationById,
  getAllEvaluations,
  getBatchEvaluations,
  getParticipantEvaluations,
  deleteEvaluation,
} = require('../controllers/EvaluationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Logging middleware
router.use((req, res, next) => {
  console.log(`📝 Evaluation Route: ${req.method} ${req.path}`);
  next();
});

// All routes require authentication
router.use(protect);

// ✅ SPECIFIC routes FIRST (before :id)
router.post('/assign', authorize('admin'), assignEvaluation);
router.get('/my-evaluations', getMyEvaluations);
router.get('/batch/:batchId', authorize('admin'), getBatchEvaluations);
router.put('/:id/submit', submitEvaluation);

// Admin routes
router.get('/', authorize('admin'), getAllEvaluations);
router.delete('/:id', authorize('admin'), deleteEvaluation);

// ✅ GENERIC routes LAST (after specific ones)
router.get('/participant/:participantId', getParticipantEvaluations);
router.get('/:id', getEvaluationById);

module.exports = router;