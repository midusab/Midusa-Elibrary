const { prisma } = require('../config/database');
const paymentService = require('../payment/payment.service');

const isUuid = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

// Helper to resolve an authenticated user to a valid PostgreSQL UUID
async function resolveDbUserId(user) {
  if (!user) return null;
  const rawId = user.id;
  const email = user.email;

  if (isUuid(rawId)) {
    const existing = await prisma.users.findUnique({ where: { id: rawId } });
    if (existing) return existing.id;
  }

  if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    let dbUser = await prisma.users.findUnique({ where: { email: normalizedEmail } });
    if (!dbUser) {
      dbUser = await prisma.users.create({
        data: {
          email: normalizedEmail,
          fullname: user.fullname || user.name || normalizedEmail.split('@')[0],
          avatar: user.avatar || '',
          role: user.role || 'user'
        }
      });
    }
    return dbUser.id;
  }

  return null;
}

// Create new order and trigger M-Pesa STK push
const createOrder = async (req, res) => {
  try {
    const { items, phoneNumber, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!phoneNumber || !String(phoneNumber).trim()) {
      return res.status(400).json({ error: 'M-PESA phone number is required' });
    }

    // Resolve user ID in PostgreSQL database
    const dbUserId = await resolveDbUserId(req.user);

    // Calculate total amount & prepare items
    let totalAmount = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const bookId = item.bookId || item.book_id;
      if (!bookId || !isUuid(bookId)) {
        return res.status(400).json({ error: `Invalid book id format: ${bookId}` });
      }

      const book = await prisma.books.findUnique({
        where: { id: bookId }
      });

      if (!book) {
        return res.status(404).json({ error: `Book with id ${bookId} not found` });
      }

      const qty = parseInt(item.quantity, 10) || 1;
      const price = Number(book.price) || 0;
      const itemTotal = price * qty;
      totalAmount += itemTotal;

      orderItemsToCreate.push({
        book_id: bookId,
        quantity: qty,
        price: price
      });
    }

    if (totalAmount < 1) {
      return res.status(400).json({ error: 'Order total must be at least KES 1' });
    }

    // Create order in 'pending' status — payment not yet confirmed
    const order = await prisma.orders.create({
      data: {
        user_id: dbUserId,
        amount: totalAmount,
        status: 'pending',
        items: {
          create: orderItemsToCreate
        }
      },
      include: {
        items: {
          include: {
            books: true
          }
        }
      }
    });

    // Trigger M-Pesa STK Push (Daraja API)
    let paymentInfo = null;
    try {
      paymentInfo = await paymentService.initiateMpesaPayment({
        userId: dbUserId,
        orderId: order.id,
        phoneNumber: String(phoneNumber).trim(),
        amount: totalAmount,
      });
    } catch (mpesaErr) {
      // If STK push fails, mark the order as failed (avoids foreign key deletion conflicts)
      await prisma.orders.update({
        where: { id: order.id },
        data: { status: 'failed' }
      }).catch(() => {});
      console.error('STK Push failed:', mpesaErr.message);
      return res.status(502).json({
        error: mpesaErr.message || 'Failed to initiate M-Pesa payment. Please check your phone number and try again.',
      });
    }

    // Format response to match frontend expectations
    const formattedOrder = {
      ...order,
      userId: order.user_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.items || []).map(it => ({
        ...it,
        bookId: it.book_id,
        book: it.books ? {
          ...it.books,
          coverImage: it.books.cover_url,
          pdfUrl: it.books.pdf_url
        } : null
      })),
      // Payment tracking info for frontend polling
      payment: paymentInfo,
    };

    res.status(201).json(formattedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const dbUserId = await resolveDbUserId(req.user);
    if (!dbUserId) {
      return res.json([]);
    }

    const orders = await prisma.orders.findMany({
      where: { user_id: dbUserId },
      include: {
        items: {
          include: {
            books: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const formattedOrders = orders.map(order => ({
      ...order,
      userId: order.user_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.items || []).map(it => ({
        ...it,
        bookId: it.book_id,
        book: it.books ? {
          ...it.books,
          coverImage: it.books.cover_url,
          pdfUrl: it.books.pdf_url
        } : null
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isUuid(id)) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const dbUserId = await resolveDbUserId(req.user);
    const where = dbUserId ? { id, user_id: dbUserId } : { id };

    const order = await prisma.orders.findFirst({
      where,
      include: {
        items: {
          include: {
            books: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const formattedOrder = {
      ...order,
      userId: order.user_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.items || []).map(it => ({
        ...it,
        bookId: it.book_id,
        book: it.books ? {
          ...it.books,
          coverImage: it.books.cover_url,
          pdfUrl: it.books.pdf_url
        } : null
      }))
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.orders.update({
      where: { id },
      data: { status }
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip: parseInt(skip, 10),
        take: parseInt(limit, 10),
        include: {
          users: {
            select: {
              id: true,
              fullname: true,
              email: true
            }
          },
          items: {
            include: {
              books: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.orders.count({ where })
    ]);

    const formattedOrders = orders.map(order => ({
      ...order,
      user: order.users,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.items || []).map(it => ({
        ...it,
        book: it.books ? {
          ...it.books,
          coverImage: it.books.cover_url,
          pdfUrl: it.books.pdf_url
        } : null
      }))
    }));

    res.json({
      orders: formattedOrders,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders
};
