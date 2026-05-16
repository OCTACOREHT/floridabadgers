require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const url = `${supabaseUrl}/rest/v1/users?select=id,full_name,password&limit=1`;
  
  console.log('Checking columns for table "users" via REST API...');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      console.log('Error detected:', json.message);
      if (json.message && json.message.includes('column "password" does not exist')) {
        console.log('RESULT: The column "password" is MISSING in the "users" table.');
      } else {
        console.log('RESULT: Other error:', json.message);
      }
    } else {
      console.log('RESULT: The column "password" EXISTS.');
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

checkSchema();
