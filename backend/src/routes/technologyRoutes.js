// backend/src/routes/technologyRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTechnology,
  getAllTechnologies,
  getTechnologyById,
  updateTechnology,
  deleteTechnology,
  updateEvaluationCriteria
} = require('../controllers/TechnologyController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Logging middleware
router.use((req, res, next) => {
  console.log(`🔧 Technology Route: ${req.method} ${req.path}`);
  next();
});

// Public routes
router.get('/', getAllTechnologies);
router.get('/:id', getTechnologyById);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), createTechnology);
router.put('/:id', protect, authorize('admin'), updateTechnology);
router.delete('/:id', protect, authorize('admin'), deleteTechnology);
router.put('/:id/criteria', protect, authorize('admin'), updateEvaluationCriteria);

module.exports = router;