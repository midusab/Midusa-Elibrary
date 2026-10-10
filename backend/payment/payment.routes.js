const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * Payment Routes Definition
 */

// 1. Trigger M-Pesa STK Push (Authenticated users)
router.post('/stkpush', auth, paymentController.initiatePayment);
router.post('/mpesa/stk', auth, paymentController.initiatePayment);

// 2. Safaricom Webhook Callback (Public endpoint for Safaricom servers)
router.post('/callback', paymentController.mpesaCallback);
router.post('/mpesa/callback', paymentController.mpesaCallback);

// 3. Query Payment Status (Polling / verification)
router.get('/status/:id', auth, paymentController.getPaymentStatus);

// 4. User Payment History
router.get('/history', auth, paymentController.getUserPayments);
router.get('/my-payments', auth, paymentController.getUserPayments);

// 5. Admin Payment Management
router.get('/admin/all', adminAuth, paymentController.getAllPayments);

module.exports = router;
