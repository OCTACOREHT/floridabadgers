/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  console.log('Checking columns for table "users"...');
  
  // Try to select one row including the password column
  const { error } = await supabase
    .from('users')
    .select('id, full_name, password')
    .limit(1);

  if (error) {
    console.log('Error detected:', error.message);
    if (error.message.includes('column "password" does not exist')) {
      console.log('RESULT: The column "password" is MISSING in the "users" table.');
    } else {
      console.log('RESULT: Other error:', error.message);
    }
  } else {
    console.log('RESULT: The column "password" EXISTS.');
  }
}

checkSchema();
