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

// 3. Safaricom C2B Real-time Validation Webhook (Public endpoint for Safaricom servers)
router.post('/c2b/validation', paymentController.c2bValidation);
router.post('/validation', paymentController.c2bValidation);

// 4. Safaricom C2B Real-time Confirmation Webhook (Public endpoint for Safaricom servers)
router.post('/c2b/confirmation', paymentController.c2bConfirmation);
router.post('/confirmation', paymentController.c2bConfirmation);

// 5. User Real-Time M-Pesa Receipt Code Validation
router.post('/validate-receipt', auth, paymentController.validateReceiptCode);
router.post('/validate-code', auth, paymentController.validateReceiptCode);

// 6. Public Payment Configuration (Till Number, business info)
router.get('/config', paymentController.getPublicPaymentConfig);

// 7. Query Payment Status (Polling / verification)
router.get('/status/:id', auth, paymentController.getPaymentStatus);

// 8. User Payment History
router.get('/history', auth, paymentController.getUserPayments);
router.get('/my-payments', auth, paymentController.getUserPayments);

// 9. Admin Payment Management & C2B URL Registration
router.post('/c2b/register-url', adminAuth, paymentController.registerC2bUrl);
router.get('/admin/all', adminAuth, paymentController.getAllPayments);


module.exports = router;
