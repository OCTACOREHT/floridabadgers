
/* eslint-disable @typescript-eslint/no-require-imports */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

async function checkDataSize() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(url, key, { realtime: { transport: ws } });

  console.log('Querying for photo_url sizes...');
  const { data, error } = await supabase
    .from('actualites')
    .select('id, titre, photo_url')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const row of data) {
    const photoUrlSize = row.photo_url ? row.photo_url.length : 0;
    console.log(`ID: ${row.id}, Title: ${row.titre?.slice(0, 30)}..., Photo Size: ${photoUrlSize} chars`);
    if (photoUrlSize > 100000) {
       console.log('WARNING: Large photo_url detected (likely base64)');
    }
  }
}

checkDataSize();
