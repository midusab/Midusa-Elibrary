const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');

// Visit tracking — records pageviews and visitors for analytics
router.post('/visit', adminController.recordSiteVisit);

// Protected admin routes
router.get('/users', adminAuth, adminController.getUsers);
router.get('/analytics', adminAuth, adminController.getAnalytics);
router.post('/sync-bestsellers', adminAuth, adminController.autoMarkBestsellers);
router.post('/reset-revenue', adminAuth, adminController.resetRevenue);

module.exports = router;
