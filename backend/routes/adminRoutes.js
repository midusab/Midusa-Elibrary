const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');

// Visit tracking — records pageviews and visitors for analytics
router.post('/visit', adminController.recordSiteVisit);

// Protected admin routes
router.get('/users', adminAuth, adminController.getUsers);
router.get('/analytics', adminAuth, adminController.getAnalytics);
router.get('/authors', adminAuth, adminController.getAuthors);
router.post('/authors', adminAuth, adminController.updateAuthor);
router.put('/authors', adminAuth, adminController.updateAuthor);
router.post('/sync-bestsellers', adminAuth, adminController.autoMarkBestsellers);
router.post('/reset-revenue', adminAuth, adminController.resetRevenue);
router.post('/reset-orders', adminAuth, adminController.resetOrders);

module.exports = router;
