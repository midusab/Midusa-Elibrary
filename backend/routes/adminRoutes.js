const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');

// Visit tracking — requires a valid login to prevent bot inflation
router.post('/visit', auth, adminController.recordSiteVisit);

// Protected admin routes
router.get('/users', adminAuth, adminController.getUsers);
router.get('/analytics', adminAuth, adminController.getAnalytics);
router.post('/sync-bestsellers', adminAuth, adminController.autoMarkBestsellers);

module.exports = router;
