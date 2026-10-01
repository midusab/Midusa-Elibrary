const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
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
    status: 'running',
    categories: [
      'Self Development',
      'Psychology',
      'Finance & Business',
      'Christianity'
    ]
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
  { path: '/api/admin',      module: './routes/adminRoutes' },
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
