const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

// Public visit tracking
router.post('/visit', adminController.recordSiteVisit);

// Protected admin routes
router.get('/users', adminAuth, adminController.getUsers);
router.get('/analytics', adminAuth, adminController.getAnalytics);
router.post('/sync-bestsellers', adminAuth, adminController.autoMarkBestsellers);

module.exports = router;
