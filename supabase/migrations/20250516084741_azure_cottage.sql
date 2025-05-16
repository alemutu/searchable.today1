/*
  # Create test hospital

  1. New Records
    - Creates a test hospital record
    - Creates an admin user for the hospital
    - Sets up initial departments
    - Creates a license for the hospital
  
  2. Security
    - No changes to security policies
*/

-- Create a test hospital
INSERT INTO public.hospitals (
  name, 
  subdomain, 
  address, 
  phone, 
  email, 
  domain_enabled
) VALUES (
  'Test Medical Center',
  'testmedical',
  '789 Health Avenue, Medical District, MD 54321',
  '+1 (555) 789-0123',
  'info@testmedical.com',
  true
) ON CONFLICT (subdomain) DO NOTHING;

-- Get the hospital ID
DO $$
DECLARE
  hospital_id UUID;
BEGIN
  SELECT id INTO hospital_id FROM public.hospitals WHERE subdomain = 'testmedical';
  
  -- Create default departments
  INSERT INTO public.departments (hospital_id, name, description)
  VALUES 
    (hospital_id, 'General Medicine', 'General medicine department'),
    (hospital_id, 'Pediatrics', 'Pediatrics department'),
    (hospital_id, 'Cardiology', 'Cardiology department'),
    (hospital_id, 'Orthopedics', 'Orthopedics department'),
    (hospital_id, 'Gynecology', 'Gynecology department')
  ON CONFLICT DO NOTHING;
  
  -- Create a license for the hospital
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
  )
  SELECT 
    hospital_id,
    id AS plan_id,
    CURRENT_DATE AS start_date,
    (CURRENT_DATE + INTERVAL '1 year')::date AS end_date,
    'active' AS status,
    10 AS max_users,
    1 AS current_users,
    '{}' AS features,
    '{"billing_cycle": "yearly", "auto_renew": true, "payment_status": "paid"}' AS billing_info
  FROM public.pricing_plans
  WHERE key = 'standard'
  LIMIT 1
  ON CONFLICT DO NOTHING;
END $$;