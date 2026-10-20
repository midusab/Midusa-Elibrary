const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const { prisma } = require('../config/database');

async function setup() {
  console.log('Ensuring authors table and author_bio column exist...');
  
  // 1. Create authors table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.authors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('✓ authors table is ready');

  // 2. Add author_bio column to books if not already present
  await prisma.$executeRawUnsafe(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='books' AND column_name='author_bio'
      ) THEN
        ALTER TABLE public.books ADD COLUMN author_bio TEXT DEFAULT '';
      END IF;
    END $$;
  `);
  console.log('✓ books.author_bio column is ready');

  // 3. Populate authors table from existing distinct authors in books
  await prisma.$executeRawUnsafe(`
    INSERT INTO public.authors (name)
    SELECT DISTINCT author FROM public.books
    WHERE author IS NOT NULL AND TRIM(author) <> ''
    ON CONFLICT (name) DO NOTHING;
  `);
  console.log('✓ authors synced from existing books');

  process.exit(0);
}

setup().catch((e) => {
  console.error('Error setting up authors table:', e.message);
  process.exit(1);
});
