const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flashSaleController');
const { adminAuth } = require('../middleware/auth');

// Public route: Get current active flash sale
router.get('/', flashSaleController.getActiveFlashSale);

// Admin routes
router.get('/admin', adminAuth, flashSaleController.getAdminFlashSale);
router.post('/admin', adminAuth, flashSaleController.saveFlashSale);
router.post('/admin/toggle', adminAuth, flashSaleController.toggleFlashSale);
router.delete('/admin', adminAuth, flashSaleController.deleteFlashSale);

module.exports = router;
