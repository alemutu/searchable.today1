const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupHosiPlus() {
  try {
    console.log('Setting up Hosi Plus hospital...');
    
    // Get hospital ID
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id')
      .eq('subdomain', 'hosiplus')
      .single();
      
    if (hospitalError) {
      throw hospitalError;
    }
    
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    const hospitalId = hospital.id;
    console.log(`Found hospital with ID: ${hospitalId}`);
    
    // Get department IDs
    const { data: departments, error: departmentsError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('hospital_id', hospitalId);
      
    if (departmentsError) {
      throw departmentsError;
    }
    
    console.log(`Found ${departments.length} departments`);
    
    // Get admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('hospital_id', hospitalId)
      .eq('role', 'admin')
      .single();
      
    if (adminError) {
      throw adminError;
    }
    
    const adminId = adminUser.id;
    console.log(`Found admin user with ID: ${adminId}`);
    
    // Create sample patients
    const patients = [
      {
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1980-05-15',
        gender: 'Male',
        contact_number: '0700123456',
        email: 'john.doe@example.com',
        address: '123 Main St, City',
        emergency_contact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '0700123457'
        },
        hospital_id: hospitalId,
        status: 'active',
        current_flow_step: 'registration',
        medical_info: {
          allergies: ['Penicillin'],
          chronicConditions: ['Hypertension'],
          bloodType: 'O+',
          smoker: false
        }
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1992-08-22',
        gender: 'Female',
        contact_number: '0700123458',
        email: 'jane.smith@example.com',
        address: '456 Oak St, City',
        emergency_contact: {
          name: 'John Smith',
          relationship: 'Spouse',
          phone: '0700123459'
        },
        hospital_id: hospitalId,
        status: 'active',
        current_flow_step: 'triage',
        medical_info: {
          allergies: [],
          chronicConditions: [],
          bloodType: 'A+',
          smoker: false
        }
      },
      {
        first_name: 'Michael',
        last_name: 'Brown',
        date_of_birth: '1965-07-18',
        gender: 'Male',
        contact_number: '0700123460',
        email: 'michael.brown@example.com',
        address: '789 Pine St, City',
        emergency_contact: {
          name: 'Sarah Brown',
          relationship: 'Spouse',
          phone: '0700123461'
        },
        hospital_id: hospitalId,
        status: 'active',
        current_flow_step: 'emergency',
        priority_level: 'critical',
        medical_info: {
          allergies: ['Sulfa drugs'],
          chronicConditions: ['Diabetes'],
          bloodType: 'B+',
          smoker: true
        }
      }
    ];
    
    for (const patient of patients) {
      const { data, error } = await supabase
        .from('patients')
        .insert([patient])
        .select();
        
      if (error) {
        console.error(`Error creating patient ${patient.first_name} ${patient.last_name}:`, error);
      } else {
        console.log(`Created patient: ${patient.first_name} ${patient.last_name}`);
      }
    }
    
    console.log('Setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up Hosi Plus:', error);
  }
}

setupHosiPlus();