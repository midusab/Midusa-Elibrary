const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { prisma } = require('../config/database');
const { delCachePattern } = require('../config/redis');

async function deduplicate() {
  const dupId = '61c5a066-a6a1-48a3-811f-364f2a47b938';
  
  try {
    const existing = await prisma.books.findUnique({ where: { id: dupId } });
    if (existing) {
      await prisma.books.delete({ where: { id: dupId } });
      console.log('Successfully deleted duplicate book:', dupId);
    } else {
      console.log('Duplicate book already deleted.');
    }
  } catch (err) {
    console.error('Error deleting duplicate book:', err.message);
  }

  try {
    await prisma.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS books_lower_title_idx ON public.books (LOWER(TRIM(title)))'
    );
    console.log('Successfully created unique index on LOWER(TRIM(title)) in Postgres');
  } catch (idxErr) {
    console.warn('Index note:', idxErr.message);
  }

  // Clear all cached books
  await delCachePattern('books:*');
  console.log('Purged books cache');

  const total = await prisma.books.count();
  console.log('Current total unique books in database:', total);
  process.exit(0);
}

deduplicate();
