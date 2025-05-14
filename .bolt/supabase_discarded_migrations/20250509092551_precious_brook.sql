/*
  # License Module Management
  
  1. Changes
    - Add purchased_add_ons field to licenses table
    - Add module_availability field to pricing_plans table
    - Create function to purchase add-on modules
    - Update existing pricing plans to include outpatient modules by default
    
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Add purchased_add_ons field to licenses table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'licenses' 
    AND column_name = 'purchased_add_ons'
  ) THEN
    ALTER TABLE licenses 
    ADD COLUMN purchased_add_ons jsonb[] DEFAULT ARRAY[]::jsonb[];
  END IF;
END $$;

-- Add module_availability field to pricing_plans table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_plans' 
    AND column_name = 'module_availability'
  ) THEN
    ALTER TABLE pricing_plans 
    ADD COLUMN module_availability jsonb DEFAULT '{
      "outpatient": true,
      "inpatient": false,
      "advanced_analytics": false,
      "telemedicine": false
    }'::jsonb;
  END IF;
END $$;

-- Update existing pricing plans to include outpatient modules by default
UPDATE pricing_plans
SET features = jsonb_set(
  features,
  '{patient_management}',
  'true'::jsonb
);

UPDATE pricing_plans
SET features = jsonb_set(
  features,
  '{appointment_scheduling}',
  'true'::jsonb
);

UPDATE pricing_plans
SET features = jsonb_set(
  features,
  '{pharmacy_management}',
  'true'::jsonb
);

UPDATE pricing_plans
SET features = jsonb_set(
  features,
  '{laboratory_management}',
  'true'::jsonb
);

UPDATE pricing_plans
SET features = jsonb_set(
  features,
  '{radiology_management}',
  'true'::jsonb
);

UPDATE pricing_plans
SET features = jsonb_set(
  features,
  '{billing_management}',
  'true'::jsonb
);

UPDATE pricing_plans
SET features = jsonb_set(
  features,
  '{simple_analytics}',
  'true'::jsonb
);

-- Create function to purchase add-on modules
CREATE OR REPLACE FUNCTION purchase_license_add_on(
  license_id uuid,
  module_id text,
  module_name text,
  price numeric,
  billing_cycle text DEFAULT 'monthly'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  purchase_date timestamp with time zone := now();
  expiry_date timestamp with time zone;
  updated_license_id uuid;
  current_add_ons jsonb[];
  new_add_on jsonb;
BEGIN
  -- Calculate expiry date based on billing cycle
  IF billing_cycle = 'monthly' THEN
    expiry_date := purchase_date + interval '1 month';
  ELSIF billing_cycle = 'yearly' THEN
    expiry_date := purchase_date + interval '1 year';
  ELSIF billing_cycle = 'lifetime' THEN
    expiry_date := NULL; -- No expiry date for lifetime
  ELSE
    RAISE EXCEPTION 'Invalid billing cycle';
  END IF;
  
  -- Get current add-ons
  SELECT purchased_add_ons INTO current_add_ons
  FROM licenses
  WHERE id = license_id;
  
  -- Create new add-on object
  new_add_on := jsonb_build_object(
    'id', module_id,
    'name', module_name,
    'price', price,
    'billing_cycle', billing_cycle,
    'purchase_date', purchase_date,
    'expiry_date', expiry_date
  );
  
  -- Update the license with the new add-on
  IF current_add_ons IS NULL THEN
    current_add_ons := ARRAY[new_add_on];
  ELSE
    current_add_ons := current_add_ons || new_add_on;
  END IF;
  
  UPDATE licenses
  SET purchased_add_ons = current_add_ons
  WHERE id = license_id
  RETURNING id INTO updated_license_id;
  
  RETURN updated_license_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION purchase_license_add_on TO authenticated;

-- Create license_add_ons table to store available add-on modules
CREATE TABLE IF NOT EXISTS license_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  module_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  price_lifetime numeric NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE license_add_ons ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read add-ons
CREATE POLICY "Authenticated users can read license add-ons"
  ON license_add_ons
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for super admins to manage add-ons
CREATE POLICY "Super admins can manage license add-ons"
  ON license_add_ons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Insert default add-on modules
INSERT INTO license_add_ons (module_id, name, description, price_monthly, price_yearly, price_lifetime, features)
VALUES
  (
    'inpatient',
    'Inpatient Management',
    'Complete inpatient ward management, bed tracking, and patient care',
    99.99,
    959.90, -- 20% discount for yearly
    2999.70, -- 5 years at 50% discount for lifetime
    '[
      "Ward and bed management",
      "Inpatient medication tracking",
      "Nurse station dashboard",
      "Patient monitoring integration",
      "Discharge planning tools"
    ]'::jsonb
  ),
  (
    'analytics',
    'Advanced Analytics',
    'Comprehensive reporting and analytics dashboard',
    49.99,
    479.90, -- 20% discount for yearly
    1499.70, -- 5 years at 50% discount for lifetime
    '[
      "Custom report builder",
      "Interactive dashboards",
      "Data export capabilities",
      "Trend analysis",
      "Financial performance metrics"
    ]'::jsonb
  ),
  (
    'telemedicine',
    'Telemedicine',
    'Virtual consultation and remote patient monitoring',
    79.99,
    767.90, -- 20% discount for yearly
    2399.70, -- 5 years at 50% discount for lifetime
    '[
      "Video consultation",
      "Secure messaging",
      "Virtual waiting room",
      "Screen sharing",
      "Digital prescription"
    ]'::jsonb
  )
ON CONFLICT (module_id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  price_lifetime = EXCLUDED.price_lifetime,
  features = EXCLUDED.features;