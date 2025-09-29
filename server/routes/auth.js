const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  deactivateAccount
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.put('/deactivate', auth, deactivateAccount);

module.exports = router;

