import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import express from 'npm:express@4.18.2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { v4 as uuidv4 } from 'npm:uuid@9.0.1';

const app = express();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Initialize Supabase client with service role key for admin operations
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Middleware to parse JSON bodies
app.use(express.json());

// Handle CORS preflight requests
app.options('*', (req, res) => {
  res.set(corsHeaders).status(204).send();
});

// Add CORS middleware
app.use((req, res, next) => {
  res.set(corsHeaders);
  next();
});

// Create a new hospital with all related resources
app.post('/hospitals', async (req, res) => {
  try {
    const { 
      hospitalProfile, 
      adminSetup, 
      moduleSelection, 
      pricingPlan, 
      licenseDetails 
    } = req.body;

    if (!hospitalProfile || !adminSetup || !moduleSelection || !pricingPlan || !licenseDetails) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // 1. Create hospital record
    const { data: hospital, error: hospitalError } = await supabaseClient
      .from('hospitals')
      .insert([{
        name: hospitalProfile.name,
        subdomain: hospitalProfile.subdomain || hospitalProfile.name.toLowerCase().replace(/\s+/g, '-'),
        address: hospitalProfile.address,
        phone: hospitalProfile.phone,
        email: hospitalProfile.email,
        domain_enabled: true
      }])
      .select()
      .single();

    if (hospitalError) {
      return res.status(500).json({ error: hospitalError.message });
    }

    // 2. Create admin user using the auth.admin API
    const { data: user, error: userError } = await supabaseClient.auth.admin.createUser({
      email: adminSetup.email || hospitalProfile.email,
      password: adminSetup.password,
      email_confirm: true,
      user_metadata: {
        first_name: adminSetup.firstName || hospitalProfile.contactPerson.split(' ')[0] || 'Admin',
        last_name: adminSetup.lastName || hospitalProfile.contactPerson.split(' ').slice(1).join(' ') || 'User',
        role: 'admin',
        hospital_id: hospital.id
      }
    });

    if (userError) {
      // Rollback hospital creation
      await supabaseClient.from('hospitals').delete().eq('id', hospital.id);
      return res.status(500).json({ error: userError.message });
    }

    // 3. Create profile for admin
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert([{
        id: user.user.id,
        first_name: adminSetup.firstName || hospitalProfile.contactPerson.split(' ')[0] || 'Admin',
        last_name: adminSetup.lastName || hospitalProfile.contactPerson.split(' ').slice(1).join(' ') || 'User',
        role: 'admin',
        hospital_id: hospital.id,
        email: adminSetup.email || hospitalProfile.email
      }]);

    if (profileError) {
      // Rollback user and hospital creation
      await supabaseClient.auth.admin.deleteUser(user.user.id);
      await supabaseClient.from('hospitals').delete().eq('id', hospital.id);
      return res.status(500).json({ error: profileError.message });
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
      return res.status(500).json({ error: modulesError.message });
    }

    // 5. Get pricing plan
    const { data: plan, error: planError } = await supabaseClient
      .from('pricing_plans')
      .select('*')
      .eq('key', pricingPlan.plan)
      .single();

    if (planError) {
      return res.status(500).json({ error: planError.message });
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
      return res.status(500).json({ error: licenseError.message });
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

    // 8. Send email if enabled
    if (adminSetup.sendCredentials) {
      // In a real implementation, this would send an email
      console.log('Would send email to:', adminSetup.email || hospitalProfile.email);
    }

    res.status(201).json({
      success: true,
      hospital: hospital,
      message: 'Hospital created successfully'
    });
  } catch (error) {
    console.error('Error in hospital onboarding:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if subdomain is available
app.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { data, error } = await supabaseClient
      .from('hospitals')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (error) throw error;
    
    res.json({ available: !data });
  } catch (error) {
    console.error('Error checking subdomain:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all hospitals
app.get('/hospitals', async (req, res) => {
  try {
    const { data, error } = await supabaseClient
      .from('hospitals')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get hospital by ID
app.get('/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseClient
      .from('hospitals')
      .select(`
        *,
        licenses (
          id,
          plan_id,
          start_date,
          end_date,
          status,
          max_users,
          current_users,
          features,
          billing_info
        ),
        hospital_modules (
          id,
          module_key,
          category,
          is_active
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ error: error.message });
  }
});

serve(app.callback());