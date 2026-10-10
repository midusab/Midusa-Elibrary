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

module.exports = {
  initiatePayment,
  mpesaCallback,
  getPaymentStatus,
  getUserPayments,
  getAllPayments,
};
