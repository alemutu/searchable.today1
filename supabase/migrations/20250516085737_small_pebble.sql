-- Create a real hospital
INSERT INTO public.hospitals (
  name, 
  subdomain, 
  address, 
  phone, 
  email, 
  domain_enabled,
  patient_id_format,
  patient_id_prefix,
  patient_id_digits,
  patient_id_auto_increment,
  patient_id_last_number
) VALUES (
  'Riverside Healthcare',
  'riverside',
  '789 Riverside Drive, Healthcare City, HC 67890',
  '+1 (555) 456-7890',
  'info@riverside-healthcare.com',
  true,
  'prefix_number',
  'RHC',
  6,
  true,
  0
) ON CONFLICT (subdomain) DO NOTHING;

-- Get the hospital ID
DO $$
DECLARE
  hospital_id UUID;
  plan_id UUID;
  next_invoice_date DATE;
  admin_id UUID;
BEGIN
  SELECT id INTO hospital_id FROM public.hospitals WHERE subdomain = 'riverside';
  
  -- Create departments
  INSERT INTO public.departments (hospital_id, name, description)
  VALUES 
    (hospital_id, 'General Medicine', 'Primary care and general medical services'),
    (hospital_id, 'Cardiology', 'Heart and cardiovascular care'),
    (hospital_id, 'Pediatrics', 'Medical care for infants, children, and adolescents'),
    (hospital_id, 'Orthopedics', 'Bone, joint, and muscle care'),
    (hospital_id, 'Gynecology', 'Women''s health services'),
    (hospital_id, 'Neurology', 'Brain and nervous system care'),
    (hospital_id, 'Dermatology', 'Skin care and treatment'),
    (hospital_id, 'Ophthalmology', 'Eye care and vision services')
  ON CONFLICT DO NOTHING;
  
  -- Create or get a pricing plan
  SELECT id INTO plan_id FROM public.pricing_plans LIMIT 1;
  
  IF plan_id IS NULL THEN
    -- Create a default pricing plan if none exists
    INSERT INTO public.pricing_plans (
      name,
      key,
      description,
      price,
      billing_cycle,
      features,
      is_active,
      max_users,
      max_storage_gb
    ) VALUES (
      'Standard Plan',
      'standard',
      'Standard hospital management plan',
      199.99,
      'month',
      ARRAY[
        '{"feature": "Patient Management", "included": true}'::jsonb,
        '{"feature": "Appointment Scheduling", "included": true}'::jsonb,
        '{"feature": "Electronic Medical Records", "included": true}'::jsonb,
        '{"feature": "Pharmacy Management", "included": true}'::jsonb,
        '{"feature": "Laboratory Integration", "included": true}'::jsonb,
        '{"feature": "Billing & Invoicing", "included": true}'::jsonb
      ],
      true,
      10,
      50
    ) RETURNING id INTO plan_id;
  END IF;
  
  -- Calculate next invoice date
  next_invoice_date := (CURRENT_DATE + INTERVAL '1 month')::date;
  
  -- Create a license
  INSERT INTO public.licenses (
    hospital_id,
    plan_id,
    start_date,
    end_date,
    status,
    max_users,
    current_users,
    features,
    billing_info
  ) VALUES (
    hospital_id,
    plan_id,
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '1 year')::date,
    'active',
    10,
    0,
    '{}'::jsonb,
    jsonb_build_object(
      'billing_cycle', 'monthly',
      'auto_renew', true,
      'payment_method', 'credit_card',
      'next_invoice_date', next_invoice_date
    )
  ) ON CONFLICT DO NOTHING;
  
  -- Generate a proper UUID for the admin user
  admin_id := gen_random_uuid();
  
  -- Create an admin user in auth.users first
  -- We'll skip this in the migration since we can't directly insert into auth.users
  -- Instead, we'll create just the profile record and disable the trigger temporarily
  
  -- Temporarily disable the trigger that expects auth user data
  ALTER TABLE public.profiles DISABLE TRIGGER on_auth_user_created;
  
  -- Create an admin profile
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    hospital_id,
    created_at,
    updated_at,
    first_login
  ) VALUES (
    admin_id,
    'Hospital',
    'Admin',
    'admin@riverside-healthcare.com',
    'admin',
    hospital_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    true
  ) ON CONFLICT DO NOTHING;
  
  -- Re-enable the trigger
  ALTER TABLE public.profiles ENABLE TRIGGER on_auth_user_created;
  
  -- Create hospital modules
  INSERT INTO public.hospital_modules (
    hospital_id,
    module_key,
    category,
    is_active,
    config
  ) VALUES 
    (hospital_id, 'patient_management', 'outpatient', true, '{}'::jsonb),
    (hospital_id, 'appointment_scheduling', 'outpatient', true, '{}'::jsonb),
    (hospital_id, 'pharmacy', 'shared', true, '{}'::jsonb),
    (hospital_id, 'laboratory', 'shared', true, '{}'::jsonb),
    (hospital_id, 'billing', 'shared', true, '{}'::jsonb)
  ON CONFLICT DO NOTHING;
  
  -- Create billing settings
  INSERT INTO public.billing_settings (
    hospital_id,
    payment_methods,
    tax_rates,
    invoice_settings,
    default_currency,
    auto_payment_reminders,
    reminder_days
  ) VALUES (
    hospital_id,
    ARRAY[
      '{"type": "cash", "enabled": true, "config": {}}'::jsonb,
      '{"type": "credit_card", "enabled": true, "config": {}}'::jsonb,
      '{"type": "debit_card", "enabled": true, "config": {}}'::jsonb,
      '{"type": "insurance", "enabled": true, "config": {}}'::jsonb,
      '{"type": "mobile_payment", "enabled": true, "config": {}}'::jsonb
    ],
    ARRAY[
      '{"name": "Standard VAT", "rate": 20, "type": "vat"}'::jsonb,
      '{"name": "Reduced Rate", "rate": 5, "type": "vat"}'::jsonb
    ],
    '{
      "prefix": "RHC-INV",
      "footer_text": "Thank you for choosing Riverside Healthcare",
      "terms_conditions": "Standard terms and conditions apply",
      "due_days": 30
    }'::jsonb,
    'USD',
    true,
    ARRAY[7, 3, 1]
  ) ON CONFLICT DO NOTHING;
  
  -- Create clinical settings
  INSERT INTO public.clinical_settings (
    hospital_id,
    type,
    settings
  ) VALUES (
    hospital_id,
    'triage',
    '{
      "vital_signs_required": ["blood_pressure", "heart_rate", "temperature", "respiratory_rate", "oxygen_saturation", "pain_level"],
      "acuity_levels": [
        {
          "level": 1,
          "name": "Critical",
          "description": "Immediate life-threatening condition",
          "color": "red",
          "max_wait_time": 0
        },
        {
          "level": 2,
          "name": "Emergency",
          "description": "High risk of deterioration",
          "color": "orange",
          "max_wait_time": 10
        },
        {
          "level": 3,
          "name": "Urgent",
          "description": "Requires urgent care",
          "color": "yellow",
          "max_wait_time": 30
        },
        {
          "level": 4,
          "name": "Semi-urgent",
          "description": "Stable but requires attention",
          "color": "green",
          "max_wait_time": 60
        },
        {
          "level": 5,
          "name": "Non-urgent",
          "description": "Minor condition",
          "color": "blue",
          "max_wait_time": 120
        }
      ]
    }'::jsonb
  ) ON CONFLICT DO NOTHING;
  
END $$;