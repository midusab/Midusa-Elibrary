const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// ─── OAuth & Core Credentials ─────────────────────────────────────────────
router.post('/google', authController.googleAuth);
router.post('/register', authController.register);
router.post('/login', authController.login);

// ─── Session Management & Token Resets ────────────────────────────────────
router.post('/refresh-token', authController.refreshToken);
router.get('/session', auth, authController.getSession);

// ─── Password Reset Token Flow ────────────────────────────────────────────
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

// ─── User Profile & Credentials ───────────────────────────────────────────
router.get('/me', auth, authController.getCurrentUser);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);

module.exports = router;
