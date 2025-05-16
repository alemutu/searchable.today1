import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createHospital() {
  try {
    // Create a new hospital
    const hospitalData = {
      name: 'General Hospital',
      subdomain: 'general',
      address: '123 Medical Center Blvd, Medical City, MC 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@generalhospital.com',
      domain_enabled: true
    };

    const { data, error } = await supabase
      .from('hospitals')
      .insert([hospitalData])
      .select();

    if (error) {
      throw error;
    }

    console.log('Hospital created successfully in Supabase:');
    console.log(data);

    // Now let's create a default admin user for this hospital
    if (data && data.length > 0) {
      const hospital = data[0];
      
      // Create admin profile
      const adminData = {
        id: 'admin-' + Math.random().toString(36).substring(2, 11), // Generate a random ID
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        hospital_id: hospital.id,
        email: 'admin@generalhospital.com'
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([adminData]);

      if (profileError) {
        console.error('Error creating admin profile:', profileError.message);
      } else {
        console.log('Admin profile created successfully');
      }
    }
  } catch (error) {
    console.error('Error creating hospital:', error.message);
  }
}

// Execute the function
createHospital();