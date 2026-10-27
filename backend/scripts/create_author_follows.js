const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating author_follows table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.author_follows (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      author_id  UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_user_author_follow UNIQUE (user_id, author_id)
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_author_follows_user_id ON public.author_follows(user_id)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_author_follows_author_id ON public.author_follows(author_id)
  `);
  console.log('author_follows table created/verified successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Migration error:', e.message);
  process.exit(1);
});
