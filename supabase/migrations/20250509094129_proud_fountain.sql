-- Create a test hospital
INSERT INTO hospitals (
  name,
  subdomain,
  address,
  phone,
  email
)
VALUES (
  'Test General Hospital',
  'testgeneral',
  '123 Test Street, Test City, Test Country',
  '+1-555-123-4567',
  'info@testgeneral.com'
)
ON CONFLICT (subdomain) DO NOTHING;

-- Get the hospital ID and create related records
DO $$
DECLARE
  v_hospital_id uuid;
  v_plan_id uuid;
  v_user_id uuid;
  v_license_id uuid;
  v_department_id uuid;
BEGIN
  -- Get the hospital ID
  SELECT id INTO v_hospital_id FROM hospitals WHERE subdomain = 'testgeneral';
  
  -- Create a test department if none exists
  IF NOT EXISTS (SELECT 1 FROM departments WHERE hospital_id = v_hospital_id) THEN
    INSERT INTO departments (
      name,
      hospital_id,
      description
    )
    VALUES (
      'General Medicine',
      v_hospital_id,
      'General medicine department for test hospital'
    )
    RETURNING id INTO v_department_id;
  ELSE
    SELECT id INTO v_department_id FROM departments WHERE hospital_id = v_hospital_id LIMIT 1;
  END IF;
  
  -- Get the Professional plan ID or create one if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pricing_plans WHERE key = 'professional') THEN
    INSERT INTO pricing_plans (
      name,
      key,
      description,
      price,
      billing_cycle,
      features,
      max_users,
      max_storage_gb,
      module_availability
    )
    VALUES (
      'Professional',
      'professional',
      'Complete solution for medium-sized hospitals',
      999.99,
      'monthly',
      jsonb_build_object(
        'appointment_scheduling', true,
        'patient_records', true,
        'billing', true,
        'pharmacy', true,
        'laboratory', true,
        'radiology', true,
        'reporting', true,
        'multi_department', true
      ),
      25,
      100,
      jsonb_build_object(
        'outpatient', true,
        'inpatient', false,
        'telemedicine', false,
        'advanced_analytics', false
      )
    )
    RETURNING id INTO v_plan_id;
  ELSE
    SELECT id INTO v_plan_id FROM pricing_plans WHERE key = 'professional';
  END IF;
  
  -- Check if a license already exists for this hospital
  IF NOT EXISTS (SELECT 1 FROM licenses WHERE hospital_id = v_hospital_id) THEN
    -- Create a license for the hospital
    INSERT INTO licenses (
      hospital_id,
      plan_id,
      start_date,
      end_date,
      status,
      max_users,
      current_users,
      features,
      billing_info
    )
    VALUES (
      v_hospital_id,
      v_plan_id,
      now(),
      now() + interval '1 year',
      'active',
      25,
      5,
      (SELECT features FROM pricing_plans WHERE id = v_plan_id),
      jsonb_build_object(
        'billing_cycle', 'monthly',
        'payment_method', 'credit_card',
        'auto_renew', true,
        'next_invoice_date', now() + interval '1 month'
      )
    )
    RETURNING id INTO v_license_id;
    
    -- Add a purchased add-on module to test the add-on functionality
    IF v_license_id IS NOT NULL THEN
      UPDATE licenses
      SET purchased_add_ons = ARRAY[
        jsonb_build_object(
          'id', 'analytics',
          'name', 'Advanced Analytics',
          'price', 479.90,
          'billing_cycle', 'yearly',
          'purchase_date', now() - interval '2 months',
          'expiry_date', now() + interval '10 months'
        )
      ]::jsonb[]
      WHERE id = v_license_id;
    END IF;
  END IF;
  
  -- Create a test admin user for the hospital if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@testgeneral.com') THEN
    -- Create auth user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      role,
      aud,
      instance_id
    )
    VALUES (
      gen_random_uuid(),
      'admin@testgeneral.com',
      crypt('password123', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '00000000-0000-0000-0000-000000000000'
    )
    RETURNING id INTO v_user_id;
    
    -- Create profile
    INSERT INTO profiles (
      id,
      first_name,
      last_name,
      role,
      hospital_id,
      email,
      department_id
    )
    VALUES (
      v_user_id,
      'Test',
      'Admin',
      'admin',
      v_hospital_id,
      'admin@testgeneral.com',
      v_department_id
    );
  END IF;
END $$;