require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('Testing Supabase REST connection...');
  
  // Try clearing payments, order_items, purchases, orders via Supabase REST
  const { data: payments, error: pErr } = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Payments delete:', pErr || 'OK');

  const { data: orderItems, error: oiErr } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Order items delete:', oiErr || 'OK');

  const { data: purchases, error: purErr } = await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Purchases delete:', purErr || 'OK');

  const { data: orders, error: oErr } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Orders delete:', oErr || 'OK');

  const { count, error: countErr } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  console.log('Remaining orders count:', count, countErr || '');
}

testSupabase();
