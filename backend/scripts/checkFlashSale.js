const { prisma } = require('../config/database');

async function check() {
  const now = new Date();
  console.log('Server Now:', now.toISOString());

  const all = await prisma.flash_sales.findMany({
    include: { sale_books: { select: { book_id: true } } },
    orderBy: { created_at: 'desc' }
  });

  console.log('\n=== All flash_sales rows ===');
  all.forEach(s => {
    console.log({
      id: s.id,
      title: s.title,
      is_active: s.is_active,
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.status,
      book_count: s.sale_books.length
    });
  });

  // Exact query from getActiveFlashSale
  const active = await prisma.flash_sales.findFirst({
    where: {
      is_active: true,
      start_time: { lte: now },
      end_time:   { gte: now },
    },
    include: { sale_books: { select: { book_id: true } } },
    orderBy: { created_at: 'desc' },
  });

  console.log('\n=== Active sale query result ===');
  console.log(active ? JSON.stringify(active, null, 2) : 'NULL — no active sale found');

  await prisma.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
