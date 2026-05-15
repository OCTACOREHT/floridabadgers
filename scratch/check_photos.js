
/* eslint-disable @typescript-eslint/no-require-imports */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkPhotos() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  
  if (!url || !key) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('actualites')
    .select('id, titre, photo_url, is_published')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching actualites:', error);
    return;
  }

  console.log('--- Recent Actualites ---');
  data.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`Titre: ${row.titre}`);
    console.log(`Photo URL: ${row.photo_url}`);
    console.log(`Published: ${row.is_published}`);
    console.log('-------------------------');
  });
}

checkPhotos();
