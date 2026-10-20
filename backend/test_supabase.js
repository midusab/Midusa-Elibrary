require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const tables = ['books', 'categories', 'authors', 'users', 'orders', 'purchases'];
  for (const t of tables) {
    const { data, count, error } = await supabase.from(t).select('*', { count: 'exact' });
    console.log(`Table ${t}: count=${count}, dataLen=${data?.length}, error=`, error?.message || null);
    if (data && data.length > 0) {
      console.log(`  Sample ${t}:`, data[0]);
    }
  }
}

inspect();
