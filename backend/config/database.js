const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Handle connection errors
prisma.$connect()
  .then(() => console.log('Supabase database connected successfully via Prisma'))
  .catch((error) => {
    console.error('Database connection error:', error.message || error);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Provide model aliases for compatibility
prisma.user = prisma.users;
prisma.book = prisma.books;
prisma.category = prisma.categories;
prisma.order = prisma.orders;
prisma.orderItem = prisma.order_items;
prisma.siteVisit = prisma.site_visits;
prisma.bookClick = prisma.book_clicks;

module.exports = { prisma, supabase };
