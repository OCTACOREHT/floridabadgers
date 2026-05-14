
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Testing connection to:', url);
  
  const supabase = createClient(url, key, {
    realtime: {
      transport: ws
    }
  });

  console.log('Querying for is_published = true...');
  const { data: published, error: pubError } = await supabase
    .from('actualites')
    .select('id, titre, is_published')
    .eq('is_published', true);
  
  if (pubError) console.error('Published Error:', pubError);
  console.log('Published articles:', published);

  console.log('Querying for all articles (first 5)...');
  const { data: all, error: allError } = await supabase
    .from('actualites')
    .select('id, titre, is_published')
    .limit(5);
    
  if (allError) console.error('All Error:', allError);
  console.log('All articles:', all);
}

testConnection();
