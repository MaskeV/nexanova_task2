// backend/src/routes/evaluationRoutes.js
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
  deleteEvaluation
} = require('../controllers/EvaluationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Logging middleware
router.use((req, res, next) => {
  console.log(`📝 Evaluation Route: ${req.method} ${req.path}`);
  next();
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

// Shared routes (Admin, Evaluator assigned, Participant own)
router.get('/:id', getEvaluationById);
router.get('/participant/:participantId', getParticipantEvaluations);

module.exports = router;