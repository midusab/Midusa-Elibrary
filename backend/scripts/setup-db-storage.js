const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const { prisma } = require('../config/database');

async function setup() {
  console.log('Creating book_files table in PostgreSQL if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.book_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size BIGINT NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('book_files table is ready!');
  process.exit(0);
}

setup().catch((e) => {
  console.error('Error creating book_files table:', e);
  process.exit(1);
});
