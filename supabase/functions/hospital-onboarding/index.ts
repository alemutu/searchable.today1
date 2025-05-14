import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { hospitalProfile, adminSetup, moduleSelection, pricingPlan, licenseDetails } = await req.json();

    if (!hospitalProfile || !adminSetup || !moduleSelection || !pricingPlan || !licenseDetails) {
      return new Response(
        JSON.stringify({ error: 'Missing required data' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Create hospital record
    const { data: hospital, error: hospitalError } = await supabaseClient
      .from('hospitals')
      .insert([{
        name: hospitalProfile.name,
        subdomain: hospitalProfile.subdomain || hospitalProfile.name.toLowerCase().replace(/\s+/g, '-'),
        address: hospitalProfile.address,
        phone: hospitalProfile.phone,
        email: hospitalProfile.email
      }])
      .select()
      .single();

    if (hospitalError) {
      throw new Error(`Failed to create hospital: ${hospitalError.message}`);
    }

    // 2. Create admin user
    const { data: user, error: userError } = await supabaseClient.auth.admin.createUser({
      email: hospitalProfile.email,
      password: adminSetup.password,
      email_confirm: true,
      user_metadata: {
        first_name: hospitalProfile.contactPerson.split(' ')[0] || 'Admin',
        last_name: hospitalProfile.contactPerson.split(' ').slice(1).join(' ') || 'User',
        role: 'admin',
        hospital_id: hospital.id
      }
    });

    if (userError) {
      // Rollback hospital creation
      await supabaseClient.from('hospitals').delete().eq('id', hospital.id);
      throw new Error(`Failed to create admin user: ${userError.message}`);
    }

    // 3. Create profile for admin
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert([{
        id: user.user.id,
        first_name: hospitalProfile.contactPerson.split(' ')[0] || 'Admin',
        last_name: hospitalProfile.contactPerson.split(' ').slice(1).join(' ') || 'User',
        role: 'admin',
        hospital_id: hospital.id,
        email: hospitalProfile.email
      }]);

    if (profileError) {
      // Rollback user and hospital creation
      await supabaseClient.auth.admin.deleteUser(user.user.id);
      await supabaseClient.from('hospitals').delete().eq('id', hospital.id);
      throw new Error(`Failed to create admin profile: ${profileError.message}`);
    }

    // 4. Store selected modules
    const allModules = [
      ...moduleSelection.outpatient.map(m => ({ module: m, category: 'outpatient' })),
      ...moduleSelection.inpatient.map(m => ({ module: m, category: 'inpatient' })),
      ...moduleSelection.shared.map(m => ({ module: m, category: 'shared' })),
      ...moduleSelection.addons.map(m => ({ module: m, category: 'addon' }))
    ];

    const { error: modulesError } = await supabaseClient
      .from('hospital_modules')
      .insert(allModules.map(m => ({
        hospital_id: hospital.id,
        module_key: m.module,
        category: m.category,
        is_active: true
      })));

    if (modulesError) {
      // Rollback previous creations
      await supabaseClient.auth.admin.deleteUser(user.user.id);
      await supabaseClient.from('hospitals').delete().eq('id', hospital.id);
      throw new Error(`Failed to create hospital modules: ${modulesError.message}`);
    }

    // 5. Get pricing plan
    const { data: plan, error: planError } = await supabaseClient
      .from('pricing_plans')
      .select('*')
      .eq('key', pricingPlan.plan)
      .single();

    if (planError) {
      throw new Error(`Failed to fetch pricing plan: ${planError.message}`);
    }

    // Calculate end date
    let endDate = null;
    if (licenseDetails.type !== 'lifetime') {
      const startDate = new Date(licenseDetails.startDate);
      if (licenseDetails.type === 'monthly') {
        startDate.setMonth(startDate.getMonth() + 1);
      } else {
        startDate.setFullYear(startDate.getFullYear() + 1);
      }
      endDate = startDate.toISOString().split('T')[0];
    }

    // 6. Create license
    const { error: licenseError } = await supabaseClient
      .from('licenses')
      .insert([{
        hospital_id: hospital.id,
        plan_id: plan.id,
        start_date: licenseDetails.startDate,
        end_date: endDate,
        status: 'active',
        max_users: plan.max_users,
        current_users: 1, // Admin user
        features: {},
        billing_info: {
          billing_cycle: licenseDetails.type,
          auto_renew: licenseDetails.autoRenew,
          payment_status: 'paid',
          notes: licenseDetails.notes
        }
      }]);

    if (licenseError) {
      throw new Error(`Failed to create license: ${licenseError.message}`);
    }

    // 7. Create default departments
    const defaultDepartments = [
      'General Medicine',
      'Pediatrics',
      'Obstetrics & Gynecology',
      'Surgery',
      'Orthopedics'
    ];

    const { error: departmentsError } = await supabaseClient
      .from('departments')
      .insert(defaultDepartments.map(name => ({
        hospital_id: hospital.id,
        name: name,
        description: `${name} department`
      })));

    if (departmentsError) {
      console.error('Error creating default departments:', departmentsError);
      // Non-critical error, continue
    }

    return new Response(
      JSON.stringify({
        success: true,
        hospital: hospital,
        message: 'Hospital created successfully'
      }),
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in hospital onboarding:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during hospital onboarding'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});