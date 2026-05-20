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

// Logging middleware — next() was missing, causing all requests to hang
router.use((req, res, next) => {
  console.log(`📝 Evaluation Route: ${req.method} ${req.path}`);
  next(); // ← this was missing
});

// All routes require authentication
router.use(protect);

// Evaluator routes
router.get('/my-evaluations', getMyEvaluations);
router.put('/:id/submit', submitEvaluation);

// Admin routes
router.post('/assign', authorize('admin'), assignEvaluation);
router.get('/', authorize('admin'), getAllEvaluations);
router.get('/batch/:batchId', authorize('admin'), getBatchEvaluations);
router.delete('/:id', authorize('admin'), deleteEvaluation);

// Shared routes (admin, assigned evaluator, or own participant)
router.get('/participant/:participantId', getParticipantEvaluations);
router.get('/:id', getEvaluationById);

module.exports = router;