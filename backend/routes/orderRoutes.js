const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');

// Protected / Optional auth routes
router.post('/', optionalAuth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/my-purchases', auth, orderController.getUserPurchases);
router.get('/:id', auth, orderController.getOrderById);

// Admin only routes
router.get('/admin/all', adminAuth, orderController.getAllOrders);
router.put('/:id/status', adminAuth, orderController.updateOrderStatus);

module.exports = router;
