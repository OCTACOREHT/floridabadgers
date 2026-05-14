
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key, { realtime: { transport: ws } });

  console.log('Querying IDs and Titles ONLY...');
  console.time('smallFields');
  const { data, error } = await supabase
    .from('actualites')
    .select('id, titre')
    .limit(5);
  console.timeEnd('smallFields');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Count:', data.length);
  }
}

testConnection();
