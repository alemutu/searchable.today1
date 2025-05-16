import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyHospitals() {
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
      console.log('✅ Hospitals found in Supabase:');
      hospitals.forEach((hospital, index) => {
        console.log(`${index + 1}. ${hospital.name} (${hospital.subdomain})`);
        console.log(`   ID: ${hospital.id}`);
        console.log(`   Created: ${new Date(hospital.created_at).toLocaleString()}`);
        console.log('---');
      });

      // Check for related records
      for (const hospital of hospitals) {
        // Check departments
        const { data: departments, error: deptError } = await supabase
          .from('departments')
          .select('count')
          .eq('hospital_id', hospital.id)
          .count();
        
        if (deptError) {
          console.error(`Error checking departments for ${hospital.name}:`, deptError.message);
        } else {
          console.log(`   Departments: ${departments[0].count}`);
        }

        // Check license
        const { data: license, error: licenseError } = await supabase
          .from('licenses')
          .select('*')
          .eq('hospital_id', hospital.id)
          .maybeSingle();
        
        if (licenseError) {
          console.error(`Error checking license for ${hospital.name}:`, licenseError.message);
        } else if (license) {
          console.log(`   License: ${license.status} (expires: ${license.end_date || 'never'})`);
        } else {
          console.log(`   License: None`);
        }

        console.log('---');
      }
    } else {
      console.log('❌ No hospitals found in Supabase.');
    }
  } catch (error) {
    console.error('Error verifying hospitals:', error.message);
  }
}

// Execute the function
verifyHospitals();