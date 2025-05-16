import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkHospitals() {
  try {
    // Fetch all hospitals
    const { data: hospitals, error } = await supabase
      .from('hospitals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (hospitals && hospitals.length > 0) {
      console.log('Hospitals found in Supabase:');
      hospitals.forEach((hospital, index) => {
        console.log(`${index + 1}. ${hospital.name} (${hospital.subdomain})`);
        console.log(`   ID: ${hospital.id}`);
        console.log(`   Created: ${new Date(hospital.created_at).toLocaleString()}`);
        console.log('---');
      });
    } else {
      console.log('No hospitals found in Supabase.');
    }
  } catch (error) {
    console.error('Error checking hospitals:', error.message);
  }
}

// Execute the function
checkHospitals();