import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createHospitalDirectly() {
  try {
    console.log('Starting direct hospital creation...');
    
    // Create a new hospital
    const hospitalData = {
      name: 'Direct Hospital',
      subdomain: 'direct-hospital',
      address: '123 Direct Street, Healthcare City, HC 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@directhospital.com',
      domain_enabled: true,
      patient_id_format: 'prefix_number',
      patient_id_prefix: 'DH',
      patient_id_digits: 6,
      patient_id_auto_increment: true,
      patient_id_last_number: 0
    };

    console.log('Inserting hospital record...');
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .insert([hospitalData])
      .select();

    if (hospitalError) {
      throw hospitalError;
    }

    if (!hospital || hospital.length === 0) {
      throw new Error('Hospital was not created');
    }

    console.log('✅ Hospital created successfully:');
    console.log(hospital[0]);
    
    // Create departments
    console.log('Creating departments...');
    const departments = [
      { name: 'General Medicine', description: 'General medicine department' },
      { name: 'Cardiology', description: 'Cardiology department' },
      { name: 'Pediatrics', description: 'Pediatrics department' }
    ];
    
    const departmentRecords = departments.map(dept => ({
      hospital_id: hospital[0].id,
      name: dept.name,
      description: dept.description
    }));
    
    const { data: createdDepartments, error: departmentsError } = await supabase
      .from('departments')
      .insert(departmentRecords)
      .select();
      
    if (departmentsError) {
      console.error('Error creating departments:', departmentsError.message);
    } else {
      console.log(`✅ Created ${createdDepartments.length} departments`);
    }
    
    // Get a pricing plan
    console.log('Fetching pricing plan...');
    const { data: pricingPlans, error: plansError } = await supabase
      .from('pricing_plans')
      .select('*')
      .limit(1);
      
    if (plansError) {
      console.error('Error fetching pricing plans:', plansError.message);
      return;
    }
    
    if (!pricingPlans || pricingPlans.length === 0) {
      console.log('No pricing plans found. Creating a default plan...');
      
      // Create a default pricing plan if none exists
      const planData = {
        name: 'Standard Plan',
        key: 'standard',
        description: 'Standard hospital management plan',
        price: 199.99,
        billing_cycle: 'month',
        features: [
          { feature: 'Patient Management', included: true },
          { feature: 'Appointment Scheduling', included: true },
          { feature: 'Electronic Medical Records', included: true },
          { feature: 'Pharmacy Management', included: true },
          { feature: 'Laboratory Integration', included: true },
          { feature: 'Billing & Invoicing', included: true }
        ],
        is_active: true,
        max_users: 10,
        max_storage_gb: 50
      };
      
      const { data: newPlan, error: newPlanError } = await supabase
        .from('pricing_plans')
        .insert([planData])
        .select();
        
      if (newPlanError) {
        console.error('Error creating pricing plan:', newPlanError.message);
        return;
      }
      
      console.log('✅ Created default pricing plan:', newPlan[0].name);
      
      // Use the newly created plan
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .insert([{
          hospital_id: hospital[0].id,
          plan_id: newPlan[0].id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          status: 'active',
          max_users: newPlan[0].max_users,
          current_users: 0,
          features: {},
          billing_info: {
            billing_cycle: 'monthly',
            auto_renew: true,
            payment_method: 'credit_card',
            next_invoice_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
          }
        }])
        .select();
        
      if (licenseError) {
        console.error('Error creating license:', licenseError.message);
      } else {
        console.log('✅ License created successfully');
      }
    } else {
      // Use existing plan
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .insert([{
          hospital_id: hospital[0].id,
          plan_id: pricingPlans[0].id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          status: 'active',
          max_users: pricingPlans[0].max_users,
          current_users: 0,
          features: {},
          billing_info: {
            billing_cycle: 'monthly',
            auto_renew: true,
            payment_method: 'credit_card',
            next_invoice_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
          }
        }])
        .select();
        
      if (licenseError) {
        console.error('Error creating license:', licenseError.message);
      } else {
        console.log('✅ License created successfully');
      }
    }
    
    console.log('\n✅ Hospital creation completed successfully!');
    console.log(`Hospital Name: ${hospital[0].name}`);
    console.log(`Subdomain: ${hospital[0].subdomain}`);
    console.log(`ID: ${hospital[0].id}`);
    
  } catch (error) {
    console.error('❌ Error creating hospital:', error.message);
  }
}

// Execute the function
createHospitalDirectly();