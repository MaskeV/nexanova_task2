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

// Verbose logging middleware
router.use((req, res, next) => {
  console.log(`\n📝 ===== EVALUATION ROUTE HIT =====`);
  console.log(`   Method : ${req.method}`);
  console.log(`   Path   : ${req.path}`);
  console.log(`   Body   : ${JSON.stringify(req.body)}`);
  console.log(`   Headers: Authorization=${req.headers.authorization ? 'Bearer ***' : 'MISSING'}`);
  next();
});

// All routes require authentication
router.use(protect);

router.use((req, res, next) => {
  console.log(`   User   : ${req.user ? req.user._id + ' role=' + req.user.role : 'NOT SET ❌'}`);
  next();
});

// Specific routes FIRST
router.post('/assign', authorize('admin'), assignEvaluation);
router.get('/my-evaluations', getMyEvaluations);
router.get('/batch/:batchId', authorize('admin'), getBatchEvaluations);
router.put('/:id/submit', submitEvaluation);

// Admin routes
router.get('/', authorize('admin'), getAllEvaluations);
router.delete('/:id', authorize('admin'), deleteEvaluation);

// Generic routes LAST
router.get('/participant/:participantId', getParticipantEvaluations);
router.get('/:id', getEvaluationById);

module.exports = router;