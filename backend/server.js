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

// Register API Routes
try {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/books', require('./routes/bookRoutes'));
  app.use('/api/categories', require('./routes/categoryRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
} catch (e) {
  console.warn('Some route modules require database connection:', e.message);
}

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
