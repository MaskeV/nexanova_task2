const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  getAllUsers,
  updateUser,
  deleteUser
} = require('../controllers/authController');
const {
  forgotPassword,
  verifyResetCode,
  resetPassword
} = require('../controllers/passwordResetController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/register', protect, authorize('admin'), register);

// Password reset (public)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// Authenticated routes
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

// Admin-only user management (FR-2.1)
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;