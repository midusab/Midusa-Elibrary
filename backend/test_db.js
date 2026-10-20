require('dotenv').config();
const postgres = require('postgres');

async function test() {
  const sql = postgres(process.env.DATABASE_URL, { connect_timeout: 10 });
  try {
    const books = await sql`SELECT count(*) FROM public.books`;
    console.log('Books count in Postgres:', books);
    const sample = await sql`SELECT id, title, price, cover_url FROM public.books LIMIT 5`;
    console.log('Sample books:', sample);
    const categories = await sql`SELECT * FROM public.categories`;
    console.log('Categories count:', categories.length);
  } catch (err) {
    console.error('Postgres error:', err);
  } finally {
    await sql.end();
  }
}

test();
