const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy headers — required so ngrok / reverse-proxy forwarded HTTPS
// headers (X-Forwarded-Proto, X-Forwarded-Host) are recognised by Express.
// Without this, Safaricom's callback to your ngrok URL can be rejected.
app.set('trust proxy', 1);

// Enable Gzip/Deflate response compression for ultra-fast response transmission
app.use(compression());

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Root info
app.get('/', (req, res) => {
  res.json({
    message: 'MidusaElibrary API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register API Routes — each route loads independently so one failure
// does NOT prevent the others from registering
const routes = [
  { path: '/api/auth',       module: './routes/authRoutes' },
  { path: '/api/books',      module: './routes/bookRoutes' },
  { path: '/api/categories', module: './routes/categoryRoutes' },
  { path: '/api/orders',     module: './routes/orderRoutes' },
  { path: '/api/payments',   module: './payment/payment.routes' },
  { path: '/payments',       module: './payment/payment.routes' },
  { path: '/api/admin',      module: './routes/adminRoutes' },
  { path: '/api/upload',     module: './routes/uploadRoutes' },
  { path: '/api/flashsale',  module: './routes/flashSaleRoutes' },
  { path: '/api/reviews',    module: './routes/reviewRoutes' },
];

routes.forEach(({ path, module }) => {
  try {
    app.use(path, require(module));
    console.log(`✓ Route registered: ${path}`);
  } catch (e) {
    console.error(`✗ Failed to register route ${path}:`, e.message);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Process safety handlers
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

// ─── Redis Async Background Workers ─────────────────────────────
const { registerWorker } = require('./config/redis');
const { db } = require('./config/database');

const isUuid = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

// Worker 1: Asynchronous Book Click & View Aggregation
registerWorker('record_book_click', async (payload) => {
  try {
    const { bookId, visitorId, userId } = payload || {};
    if (!bookId) return;

    await db.books.update({
      where: { id: bookId },
      data: { clicks_count: { increment: 1 } }
    });

    await db.book_clicks.create({
      data: {
        book_id: bookId,
        visitor_id: visitorId || null,
        user_id: isUuid(userId) ? userId : null
      }
    });
  } catch (err) {
    // Non-fatal logging for async worker
    console.warn('[Worker: record_book_click]:', err.message);
  }
}, 1000);

// Worker 2: Asynchronous Site Visit & Pageview Tracking
registerWorker('record_site_visit', async (payload) => {
  try {
    const { visitorId, userId, pagePath, referrer } = payload || {};
    await db.site_visits.create({
      data: {
        visitor_id: visitorId || null,
        user_id: isUuid(userId) ? userId : null,
        page_path: pagePath || '/',
        referrer: referrer || null
      }
    });
  } catch (err) {
    // Non-fatal logging for async worker
    console.warn('[Worker: record_site_visit]:', err.message);
  }
}, 1000);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (http://localhost:${PORT})`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`M-Pesa Callback URL: ${process.env.MPESA_CALLBACK_URL || '⚠ NOT SET'}`);
  });
}

module.exports = app;
