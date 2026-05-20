// backend/src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
  generateBatchReport,
  generateTechnologyReport,
  generateParticipantReport,
  generateEvaluatorReport,
  getSystemStats
} = require('../controllers/ReportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Logging middleware
router.use((req, res, next) => {
  console.log(`📊 Report Route: ${req.method} ${req.path}`);
  next();
});

// All routes require authentication
router.use(protect);

// Admin routes
router.get('/stats', authorize('admin'), getSystemStats);
router.get('/batch/:batchId', authorize('admin'), generateBatchReport);
router.get('/technology/:technologyId', authorize('admin'), generateTechnologyReport);
router.get('/evaluator/:evaluatorId', authorize('admin'), generateEvaluatorReport);

// Shared routes (Admin or own participant)
router.get('/participant/:participantId', generateParticipantReport);

module.exports = router;