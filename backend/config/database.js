/**
 * Database Gateway
 * Direct access to Postgres database containing all books, users, and orders.
 */
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// 1. Primary DB Engine: Prisma connected directly to the PostgreSQL database
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// 2. Optional Supabase client (for Storage buckets, auth triggers, etc.)
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
} catch (err) {
  console.warn('Supabase client notice:', err.message);
}

// Ensure database connection
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to Postgres database successfully (Real-time DB online)');
  })
  .catch((err) => {
    console.error('⚠️ Database connection warning:', err.message);
  });

module.exports = {
  prisma,
  db: prisma,
  supabase
};
