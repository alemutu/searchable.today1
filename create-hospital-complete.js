import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createCompleteHospital() {
  try {
    console.log('Starting hospital creation process...');
    
    // 1. Create a new hospital
    const hospitalData = {
      name: 'Memorial Medical Center',
      subdomain: 'memorial',
      address: '456 Healthcare Drive, Medical City, MC 54321',
      phone: '+1 (555) 987-6543',
      email: 'info@memorialmedical.com',
      domain_enabled: true,
      patient_id_format: 'prefix_number',
      patient_id_prefix: 'MMC',
      patient_id_digits: 6,
      patient_id_auto_increment: true,
      patient_id_last_number: 0
    };

    console.log('Creating hospital record...');
    const { data: hospitalData1, error: hospitalError } = await supabase
      .from('hospitals')
      .insert([hospitalData])
      .select();

    if (hospitalError) {
      throw hospitalError;
    }

    if (!hospitalData1 || hospitalData1.length === 0) {
      throw new Error('Hospital was not created');
    }

    const hospital = hospitalData1[0];
    console.log('Hospital created successfully:', hospital.name);
    
    // 2. Create departments
    console.log('Creating departments...');
    const departments = [
      { name: 'General Medicine', description: 'Primary care and general medical services' },
      { name: 'Cardiology', description: 'Heart and cardiovascular care' },
      { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents' },
      { name: 'Orthopedics', description: 'Bone, joint, and muscle care' },
      { name: 'Gynecology', description: 'Women\'s health services' },
      { name: 'Neurology', description: 'Brain and nervous system care' },
      { name: 'Dermatology', description: 'Skin care and treatment' },
      { name: 'Ophthalmology', description: 'Eye care and vision services' }
    ];
    
    const departmentRecords = departments.map(dept => ({
      hospital_id: hospital.id,
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
      console.log(`Created ${createdDepartments.length} departments`);
    }
    
    // 3. Get a pricing plan
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
      
      pricingPlans[0] = newPlan[0];
      console.log('Created default pricing plan:', newPlan[0].name);
    }
    
    // 4. Create a license
    console.log('Creating license...');
    const licenseData = {
      hospital_id: hospital.id,
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
    };
    
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert([licenseData])
      .select();
      
    if (licenseError) {
      console.error('Error creating license:', licenseError.message);
    } else {
      console.log('License created successfully');
    }
    
    // 5. Create an admin user
    console.log('Creating admin user...');
    const adminData = {
      id: `admin-${Date.now()}`,
      first_name: 'Hospital',
      last_name: 'Admin',
      email: `admin@${hospital.subdomain}.com`,
      role: 'admin',
      hospital_id: hospital.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: adminError } = await supabase
      .from('profiles')
      .insert([adminData]);
      
    if (adminError) {
      console.error('Error creating admin user:', adminError.message);
    } else {
      console.log('Admin user created successfully');
    }
    
    // 6. Create hospital modules
    console.log('Creating hospital modules...');
    const modules = [
      { module_key: 'patient_management', category: 'outpatient' },
      { module_key: 'appointment_scheduling', category: 'outpatient' },
      { module_key: 'pharmacy', category: 'shared' },
      { module_key: 'laboratory', category: 'shared' },
      { module_key: 'billing', category: 'shared' }
    ];
    
    const moduleRecords = modules.map(module => ({
      hospital_id: hospital.id,
      module_key: module.module_key,
      category: module.category,
      is_active: true,
      config: {}
    }));
    
    const { error: modulesError } = await supabase
      .from('hospital_modules')
      .insert(moduleRecords);
      
    if (modulesError) {
      console.error('Error creating hospital modules:', modulesError.message);
    } else {
      console.log(`Created ${modules.length} hospital modules`);
    }
    
    // 7. Create billing settings
    console.log('Creating billing settings...');
    const billingSettingsData = {
      hospital_id: hospital.id,
      payment_methods: [
        { type: 'cash', enabled: true, config: {} },
        { type: 'credit_card', enabled: true, config: {} },
        { type: 'debit_card', enabled: true, config: {} },
        { type: 'insurance', enabled: true, config: {} },
        { type: 'mobile_payment', enabled: true, config: {} }
      ],
      tax_rates: [
        { name: 'Standard VAT', rate: 20, type: 'vat' },
        { name: 'Reduced Rate', rate: 5, type: 'vat' }
      ],
      invoice_settings: {
        prefix: 'MMC-INV',
        footer_text: 'Thank you for choosing Memorial Medical Center',
        terms_conditions: 'Standard terms and conditions apply',
        due_days: 30
      },
      default_currency: 'USD',
      auto_payment_reminders: true,
      reminder_days: [7, 3, 1]
    };
    
    const { error: billingSettingsError } = await supabase
      .from('billing_settings')
      .insert([billingSettingsData]);
      
    if (billingSettingsError) {
      console.error('Error creating billing settings:', billingSettingsError.message);
    } else {
      console.log('Billing settings created successfully');
    }
    
    // 8. Create clinical settings
    console.log('Creating clinical settings...');
    const clinicalSettingsData = {
      hospital_id: hospital.id,
      type: 'triage',
      settings: {
        vital_signs_required: [
          'blood_pressure',
          'heart_rate',
          'temperature',
          'respiratory_rate',
          'oxygen_saturation',
          'pain_level'
        ],
        acuity_levels: [
          {
            level: 1,
            name: 'Critical',
            description: 'Immediate life-threatening condition',
            color: 'red',
            max_wait_time: 0
          },
          {
            level: 2,
            name: 'Emergency',
            description: 'High risk of deterioration',
            color: 'orange',
            max_wait_time: 10
          },
          {
            level: 3,
            name: 'Urgent',
            description: 'Requires urgent care',
            color: 'yellow',
            max_wait_time: 30
          },
          {
            level: 4,
            name: 'Semi-urgent',
            description: 'Stable but requires attention',
            color: 'green',
            max_wait_time: 60
          },
          {
            level: 5,
            name: 'Non-urgent',
            description: 'Minor condition',
            color: 'blue',
            max_wait_time: 120
          }
        ]
      }
    };
    
    const { error: clinicalSettingsError } = await supabase
      .from('clinical_settings')
      .insert([clinicalSettingsData]);
      
    if (clinicalSettingsError) {
      console.error('Error creating clinical settings:', clinicalSettingsError.message);
    } else {
      console.log('Clinical settings created successfully');
    }
    
    console.log('\n✅ Hospital creation completed successfully!');
    console.log(`Hospital Name: ${hospital.name}`);
    console.log(`Subdomain: ${hospital.subdomain}`);
    console.log(`ID: ${hospital.id}`);
    
    return hospital;
  } catch (error) {
    console.error('Error creating hospital:', error.message);
  }
}

// Execute the function
createCompleteHospital();