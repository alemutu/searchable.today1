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
) 
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.pricing_plans LIMIT 1
);