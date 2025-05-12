/*
  # Update License Module Availability
  
  1. Changes
    - Make all outpatient modules available by default in all license types
    - Make inpatient modules available only as an add-on fee
    - Update existing pricing plans with new feature configuration
    - Add module_availability field to pricing_plans table
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add module_availability field to pricing_plans if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_plans' 
    AND column_name = 'module_availability'
  ) THEN
    ALTER TABLE pricing_plans 
    ADD COLUMN module_availability jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update existing pricing plans to make outpatient modules available by default
UPDATE pricing_plans
SET features = jsonb_build_object(
  'patient_management', true,
  'appointment_scheduling', true,
  'basic_reporting', true,
  'email_notifications', true,
  'electronic_prescriptions', true,
  'outpatient_management', true,
  'pharmacy_management', true,
  'laboratory_management', true,
  'radiology_management', true,
  'billing_management', true,
  'inpatient_management', false,
  'advanced_analytics', CASE WHEN key IN ('professional', 'enterprise') THEN true ELSE false END,
  'telemedicine', CASE WHEN key IN ('professional', 'enterprise') THEN true ELSE false END,
  'api_access', CASE WHEN key = 'enterprise' THEN true ELSE false END,
  'custom_branding', CASE WHEN key = 'enterprise' THEN true ELSE false END,
  'priority_support', CASE WHEN key = 'enterprise' THEN true ELSE false END
),
module_availability = jsonb_build_object(
  'outpatient', true,
  'pharmacy', true,
  'laboratory', true,
  'radiology', true,
  'billing', true,
  'appointments', true,
  'inpatient', false,
  'advanced_analytics', CASE WHEN key IN ('professional', 'enterprise') THEN true ELSE false END,
  'telemedicine', CASE WHEN key IN ('professional', 'enterprise') THEN true ELSE false END,
  'api_integration', CASE WHEN key = 'enterprise' THEN true ELSE false END
);

-- Create add-on modules table if it doesn't exist
CREATE TABLE IF NOT EXISTS license_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  module_key text NOT NULL,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true
);

-- Enable RLS on license_add_ons
ALTER TABLE license_add_ons ENABLE ROW LEVEL SECURITY;

-- Create policy for super admin access
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
INSERT INTO license_add_ons (name, key, description, price, module_key, features)
VALUES
  (
    'Inpatient Management',
    'inpatient_module',
    'Complete inpatient management system with ward management, bed allocation, and patient tracking',
    99.99,
    'inpatient',
    '{
      "ward_management": true,
      "bed_allocation": true,
      "inpatient_medication": true,
      "nurse_station": true,
      "discharge_planning": true
    }'
  ),
  (
    'Advanced Analytics',
    'advanced_analytics',
    'Comprehensive analytics and reporting tools for hospital management',
    49.99,
    'analytics',
    '{
      "custom_reports": true,
      "data_visualization": true,
      "trend_analysis": true,
      "export_capabilities": true
    }'
  ),
  (
    'Telemedicine',
    'telemedicine_module',
    'Virtual consultation and telemedicine capabilities',
    79.99,
    'telemedicine',
    '{
      "video_consultations": true,
      "secure_messaging": true,
      "virtual_waiting_room": true,
      "prescription_management": true
    }'
  )
ON CONFLICT (key) DO NOTHING;

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

-- Create function to purchase add-on
CREATE OR REPLACE FUNCTION purchase_license_add_on(
  license_id uuid,
  add_on_key text,
  billing_cycle text DEFAULT 'monthly'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  add_on_record record;
  license_record record;
  add_on_price numeric;
  add_on_data jsonb;
BEGIN
  -- Get add-on details
  SELECT * INTO add_on_record FROM license_add_ons WHERE key = add_on_key;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Add-on not found';
  END IF;
  
  -- Get license details
  SELECT * INTO license_record FROM licenses WHERE id = license_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'License not found';
  END IF;
  
  -- Calculate price based on billing cycle
  IF billing_cycle = 'monthly' THEN
    add_on_price := add_on_record.price;
  ELSIF billing_cycle = 'yearly' THEN
    add_on_price := add_on_record.price * 12 * 0.8; -- 20% discount
  ELSIF billing_cycle = 'lifetime' THEN
    add_on_price := add_on_record.price * 12 * 5 * 0.6; -- 5 years at 40% discount
  ELSE
    RAISE EXCEPTION 'Invalid billing cycle';
  END IF;
  
  -- Create add-on data
  add_on_data := jsonb_build_object(
    'id', add_on_record.id,
    'key', add_on_record.key,
    'name', add_on_record.name,
    'module_key', add_on_record.module_key,
    'price', add_on_price,
    'billing_cycle', billing_cycle,
    'purchase_date', now(),
    'features', add_on_record.features
  );
  
  -- Update license with new add-on
  UPDATE licenses
  SET 
    purchased_add_ons = COALESCE(purchased_add_ons, ARRAY[]::jsonb[]) || add_on_data,
    features = license_record.features || jsonb_build_object(add_on_record.module_key, true)
  WHERE id = license_id;
  
  RETURN license_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION purchase_license_add_on TO authenticated;