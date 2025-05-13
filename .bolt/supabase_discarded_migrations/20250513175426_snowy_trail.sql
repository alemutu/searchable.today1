-- Create the Hosi Plus hospital and related data
DO $$
DECLARE
  v_hospital_id uuid;
  v_plan_id uuid;
  v_user_id uuid;
  v_license_id uuid;
  v_department_ids uuid[];
  v_department_names text[] := ARRAY['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Gynecology', 'Surgery', 'Dental', 'Ophthalmology', 'Dermatology', 'Neurology'];
BEGIN
  -- Create or update the hospital
  INSERT INTO hospitals (
    name,
    subdomain,
    address,
    phone,
    email,
    domain_enabled,
    patient_id_format,
    patient_id_prefix,
    patient_id_digits
  )
  VALUES (
    'Hosi Plus',
    'hosiplus',
    '123 Healthcare Avenue, Medical District',
    '0700022249',
    'searchabletoday@gmail.com',
    true,
    'prefix_year_number',
    'HP',
    6
  )
  ON CONFLICT (subdomain) DO UPDATE
  SET 
    name = 'Hosi Plus',
    phone = '0700022249',
    email = 'searchabletoday@gmail.com'
  RETURNING id INTO v_hospital_id;
  
  -- Create departments for the hospital
  FOR i IN 1..array_length(v_department_names, 1) LOOP
    INSERT INTO departments (
      name,
      hospital_id,
      description
    )
    VALUES (
      v_department_names[i],
      v_hospital_id,
      'Department of ' || v_department_names[i] || ' at Hosi Plus'
    );
  END LOOP;
  
  -- Get or create Enterprise plan
  SELECT id INTO v_plan_id FROM pricing_plans WHERE key = 'enterprise';
  
  IF v_plan_id IS NULL THEN
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
      'Enterprise',
      'enterprise',
      'Complete solution for large hospitals',
      0.00, -- Free license
      'lifetime',
      jsonb_build_object(
        'appointment_scheduling', true,
        'patient_records', true,
        'billing', true,
        'pharmacy', true,
        'laboratory', true,
        'radiology', true,
        'reporting', true,
        'multi_department', true,
        'custom_branding', true,
        'priority_support', true,
        'unlimited_storage', true,
        'unlimited_users', true
      ),
      1000, -- Unlimited users
      1000, -- Unlimited storage
      jsonb_build_object(
        'outpatient', true,
        'inpatient', true,
        'telemedicine', true,
        'advanced_analytics', true
      )
    )
    RETURNING id INTO v_plan_id;
  END IF;
  
  -- Create a free lifetime license
  INSERT INTO licenses (
    hospital_id,
    plan_id,
    start_date,
    end_date,
    status,
    max_users,
    current_users,
    features,
    billing_info,
    purchased_add_ons
  )
  VALUES (
    v_hospital_id,
    v_plan_id,
    now(),
    NULL, -- No end date (lifetime)
    'active',
    1000, -- Unlimited users
    0,
    (SELECT features FROM pricing_plans WHERE id = v_plan_id),
    jsonb_build_object(
      'billing_cycle', 'lifetime',
      'payment_method', 'free',
      'auto_renew', false,
      'next_invoice_date', NULL
    ),
    ARRAY[
      jsonb_build_object(
        'id', 'inpatient',
        'name', 'Inpatient Management',
        'price', 0.00,
        'billing_cycle', 'lifetime',
        'purchase_date', now(),
        'expiry_date', NULL
      ),
      jsonb_build_object(
        'id', 'analytics',
        'name', 'Advanced Analytics',
        'price', 0.00,
        'billing_cycle', 'lifetime',
        'purchase_date', now(),
        'expiry_date', NULL
      ),
      jsonb_build_object(
        'id', 'telemedicine',
        'name', 'Telemedicine',
        'price', 0.00,
        'billing_cycle', 'lifetime',
        'purchase_date', now(),
        'expiry_date', NULL
      )
    ]::jsonb[]
  )
  RETURNING id INTO v_license_id;
  
  -- Create admin user for the hospital
  -- First check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'searchabletoday@gmail.com';
  
  IF v_user_id IS NULL THEN
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
      'searchabletoday@gmail.com',
      crypt('@devtoday1030', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '00000000-0000-0000-0000-000000000000'
    )
    RETURNING id INTO v_user_id;
  END IF;
  
  -- Create or update profile
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
    'Admin',
    'Hosi Plus',
    'admin',
    v_hospital_id,
    'searchabletoday@gmail.com',
    (SELECT id FROM departments WHERE hospital_id = v_hospital_id AND name = 'General Medicine' LIMIT 1)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    hospital_id = v_hospital_id,
    role = 'admin';
END $$;