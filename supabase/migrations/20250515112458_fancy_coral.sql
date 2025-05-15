/*
  # Create default hospital for development

  1. Default Hospital
    - Creates a default hospital for development
    - Creates default departments
    - Creates default admin user
*/

-- Create default hospital if it doesn't exist
INSERT INTO public.hospitals (id, name, subdomain, address, phone, email, domain_enabled)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'General Hospital',
  'general',
  '123 Main Street, Anytown, USA',
  '+1 (555) 123-4567',
  'info@generalhospital.com',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Create default departments
INSERT INTO public.departments (hospital_id, name, description)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'General Medicine', 'General Medicine department'),
  ('00000000-0000-0000-0000-000000000001', 'Cardiology', 'Cardiology department'),
  ('00000000-0000-0000-0000-000000000001', 'Pediatrics', 'Pediatrics department'),
  ('00000000-0000-0000-0000-000000000001', 'Obstetrics & Gynecology', 'Obstetrics & Gynecology department'),
  ('00000000-0000-0000-0000-000000000001', 'Surgery', 'Surgery department'),
  ('00000000-0000-0000-0000-000000000001', 'Orthopedics', 'Orthopedics department'),
  ('00000000-0000-0000-0000-000000000001', 'Dental', 'Dental department'),
  ('00000000-0000-0000-0000-000000000001', 'Eye Clinic', 'Eye Clinic department'),
  ('00000000-0000-0000-0000-000000000001', 'Physiotherapy', 'Physiotherapy department')
ON CONFLICT (hospital_id, name) DO NOTHING;

-- Create default license for the hospital
INSERT INTO public.licenses (
  hospital_id, 
  plan_id, 
  start_date, 
  end_date, 
  status, 
  max_users, 
  current_users
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.pricing_plans WHERE key = 'enterprise' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  'active',
  100,
  1
)
ON CONFLICT (id) DO NOTHING;

-- Create default clinical settings
INSERT INTO public.clinical_settings (
  hospital_id,
  type,
  settings
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
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
    ],
    "emergency_criteria": [
      {
        "condition": "Cardiac Arrest",
        "description": "No pulse, unconscious"
      },
      {
        "condition": "Respiratory Distress",
        "description": "Severe difficulty breathing"
      },
      {
        "condition": "Severe Trauma",
        "description": "Major injuries from accidents"
      }
    ]
  }'::jsonb
)
ON CONFLICT (hospital_id, type) DO NOTHING;

-- Create default billing settings
INSERT INTO public.billing_settings (
  hospital_id,
  payment_methods,
  tax_rates,
  invoice_settings,
  default_currency,
  auto_payment_reminders,
  reminder_days
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
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
    "prefix": "INV",
    "footer_text": "Thank you for your business",
    "terms_conditions": "Standard terms and conditions apply",
    "due_days": 30
  }'::jsonb,
  'USD',
  true,
  ARRAY[7, 3, 1]
)
ON CONFLICT (hospital_id) DO NOTHING;