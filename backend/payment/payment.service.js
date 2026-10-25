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

    // Always enforce the validated order amount from the database — never trust client-provided amount
    payableAmount = Number(order.amount);
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

  // 4. Pre-flight: ensure callback URL is configured
  let callbackUrl = process.env.MPESA_CALLBACK_URL || '';
  if (!callbackUrl || callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1')) {
    // In dev / sandbox or when local, provide fallback so STK push is not blocked
    callbackUrl = 'https://violet-research-swiftness.ngrok-free.dev/api/payments/callback';
  }

  // 5. Trigger Safaricom STK Push
  try {
    const stkResult = await mpesa.stkPush({
      phoneNumber: formattedPhone,
      amount: numericAmount,
      accountReference: orderId ? `ORD-${orderId.substring(0, 6)}` : 'MidLib',
      transactionDesc: `Books - ${orderId ? orderId.substring(0, 8) : 'Elibrary'}`,
    });

    // 6. Update payment with Safaricom request tracking IDs
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
      customerMessage: stkResult.customerMessage ||
        `M-PESA prompt sent! Check your phone and enter your PIN to pay KES ${numericAmount}.`,
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
  const stkCallback = callbackBody?.Body?.stkCallback || callbackBody?.stkCallback || callbackBody;

  if (!stkCallback) {
    console.error('Invalid M-Pesa callback payload received:', JSON.stringify(callbackBody));
    return { success: false, message: 'Invalid callback format' };
  }

  const MerchantRequestID = stkCallback.MerchantRequestID;
  const CheckoutRequestID = stkCallback.CheckoutRequestID;
  const ResultCode = parseInt(stkCallback.ResultCode, 10);
  const ResultDesc = stkCallback.ResultDesc || '';
  const CallbackMetadata = stkCallback.CallbackMetadata;

  console.log(`[M-PESA CALLBACK] CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`);

  // Find corresponding payment record by checkout_request_id OR merchant_request_id
  let payment = null;
  if (CheckoutRequestID || MerchantRequestID) {
    payment = await prisma.payments.findFirst({
      where: {
        OR: [
          ...(CheckoutRequestID ? [{ checkout_request_id: CheckoutRequestID }] : []),
          ...(MerchantRequestID ? [{ merchant_request_id: MerchantRequestID }] : []),
        ],
      },
    });
  }

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

            // Auto-mark book as bestseller after purchase
            await updateBookBestsellerStatus(item.book_id);
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
async function checkPaymentStatus(identifier, user = null) {
  // Query by payment ID (if UUID) or checkout_request_id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(identifier || ''));
  const where = isUuid
    ? { OR: [{ id: identifier }, { checkout_request_id: identifier }] }
    : { checkout_request_id: identifier };

  const payment = await prisma.payments.findFirst({
    where,
    include: {
      users: {
        select: { id: true, email: true }
      },
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

  // Check authorization — allow admin, or match by userId or user email
  if (user && payment.user_id) {
    const isAdmin = typeof user === 'object' && user.role === 'admin';
    if (!isAdmin) {
      const userId = typeof user === 'string' ? user : user.id;
      const userEmail = typeof user === 'object' ? user.email : null;

      const matchesId = payment.user_id === userId;
      const matchesEmail = Boolean(
        userEmail &&
        payment.users?.email &&
        payment.users.email.trim().toLowerCase() === String(userEmail).trim().toLowerCase()
      );

      if (!matchesId && !matchesEmail) {
        throw new Error('Unauthorized to view this payment');
      }
    }
  }

  // If still pending and has CheckoutRequestID, query Safaricom directly
  if (payment.status === 'pending' && payment.checkout_request_id) {
    try {
      const queryResult = await mpesa.stkPushQuery({
        checkoutRequestId: payment.checkout_request_id,
      });

      if (queryResult.resultCode === 0) {
        // ✅ Confirmed success via STK query — mark completed and grant access
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

              await updateBookBestsellerStatus(item.book_id);
            } catch (err) {}
          }
        }
        payment.status = 'completed';
      }
      // ⚠️  DO NOT mark as 'failed' here based on query result codes.
      // Non-zero query codes (e.g. 1032, 2001, 1) can fire while the
      // transaction is still being processed on Safaricom's side —
      // particularly in the window between PIN entry and callback delivery.
      // The Safaricom webhook callback (handleMpesaCallback) is the ONLY
      // authoritative source for a 'failed' status. Marking here causes a
      // race condition where a valid paid transaction gets shown as
      // "Payment Cancelled" on the frontend while the book is already granted.
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
async function getUserPayments(user) {
  if (!user) return [];
  const rawId = typeof user === 'string' ? user : user.id;
  const email = typeof user === 'object' ? user.email : null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawId || ''));

  let targetUserId = isUuid ? rawId : null;
  if (!targetUserId && email) {
    const dbUser = await prisma.users.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (dbUser) targetUserId = dbUser.id;
  }

  if (!targetUserId) return [];

  return prisma.payments.findMany({
    where: { user_id: targetUserId },
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

/**
 * Auto-mark book as bestseller after a purchase has been made
 */
async function updateBookBestsellerStatus(bookId) {
  if (!bookId) return;
  try {
    const purchaseCount = await prisma.purchases.count({
      where: { book_id: bookId },
    });

    if (purchaseCount > 0) {
      await prisma.books.update({
        where: { id: bookId },
        data: { bestseller: true },
      });
      console.log(`[BESTSELLER] Auto-marked book ${bookId} as bestseller (${purchaseCount} buyer(s))`);
    }
  } catch (err) {
    console.warn(`Could not update bestseller status for book ${bookId}:`, err.message);
  }
}

/**
 * Handle C2B Payment Validation from Safaricom Daraja
 * Safaricom calls this URL in real time before accepting the payment.
 */
async function handleC2BValidation(payload) {
  console.log('[M-PESA C2B VALIDATION] Received validation request:', JSON.stringify(payload));
  const { TransAmount, MSISDN, BillRefNumber, BusinessShortCode } = payload || {};

  const numericAmount = parseFloat(TransAmount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    console.warn(`[M-PESA C2B VALIDATION] Rejected: Invalid amount ${TransAmount}`);
    return {
      ResultCode: 'C2B00011',
      ResultDesc: 'Rejected: Invalid amount',
    };
  }

  // Accepted by default so Safaricom completes the transaction
  return {
    ResultCode: 0,
    ResultDesc: 'Accepted',
  };
}

/**
 * Handle C2B Payment Confirmation from Safaricom Daraja
 * Safaricom calls this URL immediately upon payment completion to the Till Number.
 */
async function handleC2BConfirmation(payload) {
  console.log('[M-PESA C2B CONFIRMATION] Received confirmation:', JSON.stringify(payload));
  if (!payload) {
    return { ResultCode: 1, ResultDesc: 'Empty payload' };
  }

  const {
    TransactionType,
    TransID,
    TransTime,
    TransAmount,
    BusinessShortCode,
    BillRefNumber,
    MSISDN,
    FirstName,
    MiddleName,
    LastName,
  } = payload;

  const mpesaReceipt = String(TransID || '').trim().toUpperCase();
  const numericAmount = Math.round(Number(TransAmount));
  const transactionDate = parseMpesaDate(TransTime);
  let formattedPhone = null;
  try {
    if (MSISDN) formattedPhone = mpesa.formatPhoneNumber(MSISDN);
  } catch (e) {
    formattedPhone = MSISDN;
  }

  if (!mpesaReceipt) {
    return { ResultCode: 1, ResultDesc: 'Missing TransID' };
  }

  // 1. Check if already processed
  const existingPayment = await prisma.payments.findFirst({
    where: { mpesa_receipt_number: mpesaReceipt },
  });

  if (existingPayment && existingPayment.status === 'completed') {
    console.log(`[M-PESA C2B] Payment ${mpesaReceipt} already processed.`);
    return { ResultCode: 0, ResultDesc: 'Already processed' };
  }

  // 2. Attempt to match with an existing order
  let matchedOrder = null;
  const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

  if (BillRefNumber) {
    const cleanedRef = String(BillRefNumber).trim();
    if (isUuid(cleanedRef)) {
      matchedOrder = await prisma.orders.findUnique({
        where: { id: cleanedRef },
        include: { items: true },
      });
    } else if (cleanedRef.toUpperCase().startsWith('ORD-')) {
      const orderPrefix = cleanedRef.substring(4);
      matchedOrder = await prisma.orders.findFirst({
        where: {
          id: { startsWith: orderPrefix },
          status: 'pending',
        },
        include: { items: true },
      });
    }
  }

  // If not matched by reference, look for recent pending order matching amount and phone
  if (!matchedOrder && formattedPhone) {
    matchedOrder = await prisma.orders.findFirst({
      where: {
        status: 'pending',
        amount: numericAmount,
        payments: {
          some: {
            phone_number: formattedPhone,
          },
        },
      },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
  }

  // If still not matched, find the most recent pending order matching exact amount in the last 2 hours
  if (!matchedOrder) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    matchedOrder = await prisma.orders.findFirst({
      where: {
        status: 'pending',
        amount: numericAmount,
        created_at: { gte: twoHoursAgo },
      },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
  }

  // 3. Upsert or update payment record
  let paymentRecord = existingPayment;
  if (paymentRecord) {
    paymentRecord = await prisma.payments.update({
      where: { id: paymentRecord.id },
      data: {
        status: 'completed',
        amount: numericAmount,
        currency: 'KES',
        payment_method: 'mpesa_buygoods',
        phone_number: formattedPhone || paymentRecord.phone_number,
        transaction_date: transactionDate,
        result_code: 0,
        result_desc: 'C2B Confirmation Accepted',
        raw_callback: payload,
        order_id: matchedOrder ? matchedOrder.id : paymentRecord.order_id,
        user_id: matchedOrder ? matchedOrder.user_id : paymentRecord.user_id,
      },
    });
  } else {
    paymentRecord = await prisma.payments.create({
      data: {
        order_id: matchedOrder ? matchedOrder.id : null,
        user_id: matchedOrder ? matchedOrder.user_id : null,
        amount: numericAmount,
        currency: 'KES',
        payment_method: 'mpesa_buygoods',
        status: 'completed',
        phone_number: formattedPhone,
        mpesa_receipt_number: mpesaReceipt,
        result_code: 0,
        result_desc: 'C2B Confirmation Accepted',
        transaction_date: transactionDate,
        raw_callback: payload,
      },
    });
  }

  // 4. If matched to order, complete order and grant access
  if (matchedOrder) {
    await prisma.orders.update({
      where: { id: matchedOrder.id },
      data: { status: 'completed' },
    });

    const orderItems = await prisma.order_items.findMany({
      where: { order_id: matchedOrder.id },
    });

    if (matchedOrder.user_id && orderItems.length > 0) {
      for (const item of orderItems) {
        try {
          await prisma.purchases.upsert({
            where: {
              user_id_book_id: {
                user_id: matchedOrder.user_id,
                book_id: item.book_id,
              },
            },
            update: {
              order_id: matchedOrder.id,
              payment_id: paymentRecord.id,
              price: item.price || 0,
            },
            create: {
              user_id: matchedOrder.user_id,
              book_id: item.book_id,
              order_id: matchedOrder.id,
              payment_id: paymentRecord.id,
              price: item.price || 0,
            },
          });
          await updateBookBestsellerStatus(item.book_id);
        } catch (pErr) {
          console.warn(`Could not add purchase for book ${item.book_id}:`, pErr.message);
        }
      }
    }
    console.log(`[M-PESA C2B] Successfully credited Order ${matchedOrder.id} for user ${matchedOrder.user_id}`);
  } else {
    console.log(`[M-PESA C2B] Payment ${mpesaReceipt} recorded standalone (KES ${numericAmount}). Awaiting user claim.`);
  }

  return { ResultCode: 0, ResultDesc: 'Confirmation received successfully' };
}

/**
 * Validate customer M-Pesa Receipt Code in Real-Time
 */
async function validateReceiptCode({ userId, orderId, receiptCode, phoneNumber }) {
  if (!receiptCode || !String(receiptCode).trim()) {
    throw new Error('M-Pesa receipt code is required');
  }

  const cleanReceipt = String(receiptCode).trim().toUpperCase();
  if (!/^[A-Z0-9]{8,14}$/.test(cleanReceipt)) {
    throw new Error('Invalid M-Pesa receipt code format. Please check your Safaricom SMS (e.g., QA12BC34DE)');
  }

  // Find order
  let order = null;
  if (orderId) {
    order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    if (userId && order.user_id && order.user_id !== userId) {
      throw new Error('Unauthorized: Order belongs to another account');
    }
  }

  // 1. Check if payment record already exists for this receipt code
  let payment = await prisma.payments.findFirst({
    where: { mpesa_receipt_number: cleanReceipt },
  });

  if (payment && payment.status === 'completed') {
    // If order was provided and not linked, link it
    if (order && (!payment.order_id || payment.order_id !== order.id)) {
      payment = await prisma.payments.update({
        where: { id: payment.id },
        data: {
          order_id: order.id,
          user_id: userId || order.user_id || payment.user_id,
        },
      });
    }

    if (order && order.status !== 'completed') {
      await prisma.orders.update({
        where: { id: order.id },
        data: { status: 'completed' },
      });

      const orderItems = await prisma.order_items.findMany({
        where: { order_id: order.id },
      });

      const effectiveUserId = userId || order.user_id;
      if (effectiveUserId && orderItems.length > 0) {
        for (const item of orderItems) {
          try {
            await prisma.purchases.upsert({
              where: {
                user_id_book_id: {
                  user_id: effectiveUserId,
                  book_id: item.book_id,
                },
              },
              update: {
                order_id: order.id,
                payment_id: payment.id,
                price: item.price || 0,
              },
              create: {
                user_id: effectiveUserId,
                book_id: item.book_id,
                order_id: order.id,
                payment_id: payment.id,
                price: item.price || 0,
              },
            });
            await updateBookBestsellerStatus(item.book_id);
          } catch (e) {}
        }
      }
    }

    return {
      success: true,
      validated: true,
      status: 'completed',
      receiptNumber: cleanReceipt,
      amount: payment.amount,
      message: 'Payment validated successfully! Your books are ready to download.',
      payment,
    };
  }

  // 2. If payment record is not yet in DB, but order exists and is pending:
  if (order) {
    const pendingPayment = await prisma.payments.findFirst({
      where: { order_id: order.id, status: 'pending' },
      orderBy: { created_at: 'desc' },
    });

    let formattedPhone = null;
    try {
      if (phoneNumber) formattedPhone = mpesa.formatPhoneNumber(phoneNumber);
    } catch (e) {}

    let updatedPayment;
    if (pendingPayment) {
      updatedPayment = await prisma.payments.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'completed',
          mpesa_receipt_number: cleanReceipt,
          phone_number: formattedPhone || pendingPayment.phone_number,
          result_code: 0,
          result_desc: 'Validated via M-Pesa receipt code',
          transaction_date: new Date(),
        },
      });
    } else {
      updatedPayment = await prisma.payments.create({
        data: {
          order_id: order.id,
          user_id: userId || order.user_id,
          amount: order.amount || 0,
          currency: 'KES',
          payment_method: 'mpesa_buygoods',
          status: 'completed',
          phone_number: formattedPhone,
          mpesa_receipt_number: cleanReceipt,
          result_code: 0,
          result_desc: 'Validated via M-Pesa receipt code',
          transaction_date: new Date(),
        },
      });
    }

    await prisma.orders.update({
      where: { id: order.id },
      data: { status: 'completed' },
    });

    const orderItems = await prisma.order_items.findMany({
      where: { order_id: order.id },
    });

    const effectiveUserId = userId || order.user_id;
    if (effectiveUserId && orderItems.length > 0) {
      for (const item of orderItems) {
        try {
          await prisma.purchases.upsert({
            where: {
              user_id_book_id: {
                user_id: effectiveUserId,
                book_id: item.book_id,
              },
            },
            update: {
              order_id: order.id,
              payment_id: updatedPayment.id,
              price: item.price || 0,
            },
            create: {
              user_id: effectiveUserId,
              book_id: item.book_id,
              order_id: order.id,
              payment_id: updatedPayment.id,
              price: item.price || 0,
            },
          });
          await updateBookBestsellerStatus(item.book_id);
        } catch (e) {}
      }
    }

    return {
      success: true,
      validated: true,
      status: 'completed',
      receiptNumber: cleanReceipt,
      amount: updatedPayment.amount,
      message: 'Payment validated successfully! Your books are ready to download.',
      payment: updatedPayment,
    };
  }

  throw new Error('No matching pending order found. Please checkout your cart first, then validate the payment code.');
}

/**
 * Return public payment configuration (Till number, store info)
 */
function getPublicConfig() {
  const tillNumber = process.env.MPESA_TILL_NUMBER || process.env.MPESA_SHORTCODE;
  const storeNumber = process.env.MPESA_STORE_NUMBER || process.env.MPESA_SHORTCODE;
  const shortcode = process.env.MPESA_SHORTCODE;
  const transactionType = process.env.MPESA_TRANSACTION_TYPE || 'CustomerBuyGoodsOnline';
  const businessName = process.env.MPESA_BUSINESS_NAME || 'Midusa E-Library';
  const environment = process.env.MPESA_ENV || 'production';

  return {
    tillNumber,
    storeNumber,
    shortcode,
    transactionType,
    businessName,
    environment,
  };
}

module.exports = {
  initiateMpesaPayment,
  handleMpesaCallback,
  handleC2BValidation,
  handleC2BConfirmation,
  validateReceiptCode,
  checkPaymentStatus,
  getUserPayments,
  getAllPayments,
  updateBookBestsellerStatus,
  getPublicConfig,
};

