const paymentService = require('./payment.service');

/**
 * Payment HTTP Controller & Request Validation
 */

// Initiate STK Push Payment
const initiatePayment = async (req, res) => {
  try {
    const { orderId, phoneNumber, amount } = req.body;
    const userId = req.user?.id;

    // Validate phone number presence
    if (!phoneNumber || !String(phoneNumber).trim()) {
      return res.status(400).json({ error: 'M-PESA phone number is required' });
    }

    // Validate either orderId or positive amount is provided
    if (!orderId && (!amount || Number(amount) < 1)) {
      return res.status(400).json({
        error: 'Either a valid orderId or a positive amount in KES must be provided',
      });
    }

    const result = await paymentService.initiateMpesaPayment({
      userId,
      orderId: orderId || null,
      phoneNumber: String(phoneNumber).trim(),
      amount: amount ? Number(amount) : undefined,
    });

    res.status(200).json({
      message: 'STK push sent to your phone. Please enter your M-Pesa PIN.',
      ...result,
    });
  } catch (error) {
    console.error('Error in initiatePayment controller:', error.message);
    res.status(400).json({
      error: error.message || 'Failed to initiate M-Pesa payment',
    });
  }
};

// Safaricom Webhook Callback Handler
const mpesaCallback = async (req, res) => {
  try {
    console.log('[M-PESA] Webhook received from Safaricom');
    const result = await paymentService.handleMpesaCallback(req.body);

    // Safaricom expects a standard JSON acknowledgment
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Callback received successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error handling M-Pesa callback:', error.message);
    // Always return 200 to Safaricom to prevent repeated webhook retries
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted with error logged',
    });
  }
};

// Check Status of a Payment (by ID or CheckoutRequestID)
const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Payment ID or CheckoutRequestID is required' });
    }

    const payment = await paymentService.checkPaymentStatus(id, req.user);
    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error in getPaymentStatus controller:', error.message);
    const status = error.message.includes('not found')
      ? 404
      : (error.message.includes('Unauthorized') ? 403 : 400);
    res.status(status).json({
      error: error.message || 'Failed to retrieve payment status',
    });
  }
};

// Get authenticated user payment history
const getUserPayments = async (req, res) => {
  try {
    const payments = await paymentService.getUserPayments(req.user);
    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Error in getUserPayments controller:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve payment history',
    });
  }
};

// Get all payments (Admin only)
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const data = await paymentService.getAllPayments({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
    });
    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('Error in getAllPayments controller:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve all payments',
    });
  }
};

// Safaricom C2B Real-time Validation Webhook
const c2bValidation = async (req, res) => {
  try {
    console.log('[M-PESA C2B] Incoming validation request');
    const result = await paymentService.handleC2BValidation(req.body);
    // Safaricom expects 200 with { ResultCode: 0, ResultDesc: "Accepted" }
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in C2B validation:', error.message);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted with error logged',
    });
  }
};

// Safaricom C2B Real-time Confirmation Webhook
const c2bConfirmation = async (req, res) => {
  try {
    console.log('[M-PESA C2B] Incoming confirmation notification');
    const result = await paymentService.handleC2BConfirmation(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in C2B confirmation:', error.message);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted with error logged',
    });
  }
};

// Real-time manual M-Pesa receipt verification by user
const validateReceiptCode = async (req, res) => {
  try {
    const { orderId, receiptCode, phoneNumber } = req.body;
    const userId = req.user?.id;

    if (!receiptCode || !String(receiptCode).trim()) {
      return res.status(400).json({ error: 'M-PESA receipt code is required' });
    }

    const result = await paymentService.validateReceiptCode({
      userId,
      orderId: orderId || null,
      receiptCode: String(receiptCode).trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in validateReceiptCode controller:', error.message);
    res.status(400).json({
      error: error.message || 'Failed to validate payment code',
    });
  }
};

// Register C2B URLs with Safaricom Daraja (Admin Only)
const registerC2bUrl = async (req, res) => {
  try {
    const mpesa = require('./mpesa');
    const result = await mpesa.registerC2BUrl(req.body);
    res.status(200).json({
      message: 'C2B URLs successfully registered with Safaricom',
      ...result,
    });
  } catch (error) {
    console.error('Error registering C2B URLs:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to register C2B URLs',
    });
  }
};

// Public payment configuration (Till Number, instructions)
const getPublicPaymentConfig = async (req, res) => {
  try {
    const config = paymentService.getPublicConfig();
    res.status(200).json({
      success: true,
      ...config,
    });
  } catch (error) {
    console.error('Error fetching public payment config:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve payment configuration',
    });
  }
};

module.exports = {
  initiatePayment,
  mpesaCallback,
  c2bValidation,
  c2bConfirmation,
  validateReceiptCode,
  registerC2bUrl,
  getPublicPaymentConfig,
  getPaymentStatus,
  getUserPayments,
  getAllPayments,
};

