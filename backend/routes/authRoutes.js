const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Google OAuth — client sends Firebase ID token, we return our JWT
router.post('/google', authController.googleAuth);

// Protected profile route
router.get('/me', auth, authController.getCurrentUser);

// Legacy stubs (kept so existing route references don't 404)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);

module.exports = router;
