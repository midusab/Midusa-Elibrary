const { prisma } = require('../config/database');
const mpesa = require('./mpesa');

/**
 * Payment Business Logic Service
 */

/**
 * Convert Safaricom numeric timestamp (YYYYMMDDHHmmss) to JavaScript Date
 */
function parseMpesaDate(dateStr) {
  if (!dateStr || String(dateStr).length < 14) return new Date();
  const str = String(dateStr);
  const year = parseInt(str.substring(0, 4), 10);
  const month = parseInt(str.substring(4, 6), 10) - 1;
  const day = parseInt(str.substring(6, 8), 10);
  const hour = parseInt(str.substring(8, 10), 10);
  const minute = parseInt(str.substring(10, 12), 10);
  const second = parseInt(str.substring(12, 14), 10);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Initiate an M-Pesa STK Push Payment
 */
async function initiateMpesaPayment({ userId, orderId, phoneNumber, amount }) {
  let payableAmount = amount;
  let order = null;

  // 1. If orderId is provided, validate and fetch the order
  if (orderId) {
    order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            books: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (userId && order.user_id !== userId) {
      throw new Error('Unauthorized: Order does not belong to the user');
    }

    if (!payableAmount) {
      payableAmount = Number(order.amount);
    }
  }

  const numericAmount = Math.round(Number(payableAmount));
  if (isNaN(numericAmount) || numericAmount < 1) {
    throw new Error('Valid payment amount in KES is required');
  }

  // 2. Format phone number
  const formattedPhone = mpesa.formatPhoneNumber(phoneNumber);

  // 3. Create a pending payment record in DB
  const payment = await prisma.payments.create({
    data: {
      user_id: userId || order?.user_id || null,
      order_id: orderId || null,
      amount: numericAmount,
      currency: 'KES',
      payment_method: 'mpesa',
      status: 'pending',
      phone_number: formattedPhone,
    },
  });

  // 4. Trigger Safaricom STK Push
  try {
    const stkResult = await mpesa.stkPush({
      phoneNumber: formattedPhone,
      amount: numericAmount,
      accountReference: orderId ? `ORD-${orderId.substring(0, 6)}` : 'Elibrary',
      transactionDesc: `Payment for ${orderId ? `Order ${orderId.substring(0, 8)}` : 'Books'}`,
    });

    // 5. Update payment with Safaricom request tracking IDs
    const updatedPayment = await prisma.payments.update({
      where: { id: payment.id },
      data: {
        merchant_request_id: stkResult.merchantRequestId,
        checkout_request_id: stkResult.checkoutRequestId,
      },
    });

    return {
      success: true,
      paymentId: updatedPayment.id,
      checkoutRequestId: stkResult.checkoutRequestId,
      merchantRequestId: stkResult.merchantRequestId,
      customerMessage: stkResult.customerMessage,
      amount: numericAmount,
      phoneNumber: formattedPhone,
      status: 'pending',
    };
  } catch (error) {
    // If STK Push fails immediately, mark payment as failed
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        result_desc: error.message,
      },
    });
    throw error;
  }
}

/**
 * Process Callback from Safaricom Daraja Webhook
 */
async function handleMpesaCallback(callbackBody) {
  const stkCallback = callbackBody?.Body?.stkCallback;

  if (!stkCallback) {
    console.error('Invalid M-Pesa callback payload received:', JSON.stringify(callbackBody));
    return { success: false, message: 'Invalid callback format' };
  }

  const {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    CallbackMetadata,
  } = stkCallback;

  console.log(`[M-PESA CALLBACK] CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`);

  // Find corresponding payment record
  const payment = await prisma.payments.findFirst({
    where: {
      checkout_request_id: CheckoutRequestID,
    },
  });

  if (!payment) {
    console.warn(`Payment with CheckoutRequestID ${CheckoutRequestID} not found in database.`);
    return { success: false, message: 'Payment record not found' };
  }

  // ResultCode 0 indicates payment success
  if (ResultCode === 0 && CallbackMetadata?.Item) {
    const metadataItems = CallbackMetadata.Item;
    const getValue = (name) => metadataItems.find((it) => it.Name === name)?.Value;

    const mpesaReceipt = String(getValue('MpesaReceiptNumber') || '');
    const transactionDateRaw = getValue('TransactionDate');
    const transactionDate = parseMpesaDate(transactionDateRaw);
    const amountPaid = getValue('Amount') || payment.amount;

    // 1. Update Payment record to completed
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        mpesa_receipt_number: mpesaReceipt,
        result_code: ResultCode,
        result_desc: ResultDesc,
        transaction_date: transactionDate,
        raw_callback: callbackBody,
      },
    });

    // 2. If linked to an order, update order and grant user purchases
    if (payment.order_id) {
      await prisma.orders.update({
        where: { id: payment.order_id },
        data: { status: 'completed' },
      });

      // Fetch order items to populate user purchases / library
      const orderItems = await prisma.order_items.findMany({
        where: { order_id: payment.order_id },
      });

      if (payment.user_id && orderItems.length > 0) {
        for (const item of orderItems) {
          try {
            await prisma.purchases.upsert({
              where: {
                user_id_book_id: {
                  user_id: payment.user_id,
                  book_id: item.book_id,
                },
              },
              update: {
                order_id: payment.order_id,
                payment_id: payment.id,
                price: item.price || 0,
              },
              create: {
                user_id: payment.user_id,
                book_id: item.book_id,
                order_id: payment.order_id,
                payment_id: payment.id,
                price: item.price || 0,
              },
            });
          } catch (pErr) {
            console.warn(`Could not add purchase for book ${item.book_id}:`, pErr.message);
          }
        }
      }
    }

    return { success: true, status: 'completed', mpesaReceipt };
  } else {
    // Payment cancelled or failed by user
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        result_code: ResultCode,
        result_desc: ResultDesc,
        raw_callback: callbackBody,
      },
    });

    if (payment.order_id) {
      await prisma.orders.update({
        where: { id: payment.order_id },
        data: { status: 'failed' },
      });
    }

    return { success: true, status: 'failed', reason: ResultDesc };
  }
}

/**
 * Check Payment Status (by payment ID or CheckoutRequestID)
 */
async function checkPaymentStatus(identifier, userId = null) {
  // Query by payment ID (if UUID) or checkout_request_id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(identifier || ''));
  const where = isUuid
    ? { OR: [{ id: identifier }, { checkout_request_id: identifier }] }
    : { checkout_request_id: identifier };

  const payment = await prisma.payments.findFirst({
    where,
    include: {
      orders: {
        include: {
          items: {
            include: { books: true },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (userId && payment.user_id && payment.user_id !== userId) {
    throw new Error('Unauthorized to view this payment');
  }

  // If still pending and has CheckoutRequestID, query Safaricom directly
  if (payment.status === 'pending' && payment.checkout_request_id) {
    try {
      const queryResult = await mpesa.stkPushQuery({
        checkoutRequestId: payment.checkout_request_id,
      });

      if (queryResult.resultCode === 0) {
        // Successful
        await prisma.payments.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            result_code: 0,
            result_desc: queryResult.resultDesc,
          },
        });

        if (payment.order_id) {
          await prisma.orders.update({
            where: { id: payment.order_id },
            data: { status: 'completed' },
          });

          // Add to purchases
          const orderItems = await prisma.order_items.findMany({
            where: { order_id: payment.order_id },
          });

          for (const item of orderItems) {
            try {
              await prisma.purchases.upsert({
                where: {
                  user_id_book_id: {
                    user_id: payment.user_id,
                    book_id: item.book_id,
                  },
                },
                update: {
                  order_id: payment.order_id,
                  payment_id: payment.id,
                },
                create: {
                  user_id: payment.user_id,
                  book_id: item.book_id,
                  order_id: payment.order_id,
                  payment_id: payment.id,
                  price: item.price || 0,
                },
              });
            } catch (err) {}
          }
        }
        payment.status = 'completed';
      } else if (queryResult.resultCode && queryResult.resultCode !== 1032) {
        // Any error code other than 1032 (cancelled) or 0 indicates failure
        await prisma.payments.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            result_code: queryResult.resultCode,
            result_desc: queryResult.resultDesc,
          },
        });
        payment.status = 'failed';
      }
    } catch (queryErr) {
      // In sandbox or during pending phase, queries may return error while user hasn't entered PIN yet
      console.log('STK Query status check info:', queryErr.message);
    }
  }

  return payment;
}

/**
 * Get User Payments History
 */
async function getUserPayments(userId) {
  return prisma.payments.findMany({
    where: { user_id: userId },
    include: {
      orders: {
        select: {
          id: true,
          amount: true,
          status: true,
          created_at: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}

/**
 * Get All Payments (Admin)
 */
async function getAllPayments({ page = 1, limit = 20, status }) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [payments, total] = await Promise.all([
    prisma.payments.findMany({
      where,
      skip: parseInt(skip, 10),
      take: parseInt(limit, 10),
      include: {
        users: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
        orders: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.payments.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  initiateMpesaPayment,
  handleMpesaCallback,
  checkPaymentStatus,
  getUserPayments,
  getAllPayments,
};
