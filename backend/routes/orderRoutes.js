const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');

// Protected routes
router.post('/', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/:id', auth, orderController.getOrderById);

// Admin only routes
router.get('/admin/all', adminAuth, orderController.getAllOrders);
router.put('/:id/status', adminAuth, orderController.updateOrderStatus);

module.exports = router;
