/*
  # Add license upgrade functionality
  
  1. Changes
    - Update licenses table to support different billing cycles
    - Add billing_cycle field to pricing_plans table if not exists
    - Add default pricing plans for different tiers
    
  2. Security
    - Maintain existing RLS policies
*/

-- Ensure pricing_plans has the billing_cycle field
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_plans' 
    AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE pricing_plans 
    ADD COLUMN billing_cycle text NOT NULL DEFAULT 'monthly';
  END IF;
END $$;

-- Insert default pricing plans if they don't exist
INSERT INTO pricing_plans (name, key, description, price, billing_cycle, features, max_users, max_storage_gb)
VALUES
  (
    'Basic',
    'basic',
    'Essential features for small hospitals',
    49.99,
    'monthly',
    '{
      "patient_management": true,
      "appointment_scheduling": true,
      "basic_reporting": true,
      "email_notifications": true,
      "electronic_prescriptions": false,
      "advanced_analytics": false,
      "telemedicine": false,
      "api_access": false,
      "custom_branding": false,
      "priority_support": false
    }',
    10,
    5
  ),
  (
    'Professional',
    'professional',
    'Advanced features for growing hospitals',
    99.99,
    'monthly',
    '{
      "patient_management": true,
      "appointment_scheduling": true,
      "basic_reporting": true,
      "email_notifications": true,
      "electronic_prescriptions": true,
      "advanced_analytics": true,
      "telemedicine": true,
      "api_access": false,
      "custom_branding": false,
      "priority_support": false
    }',
    25,
    20
  ),
  (
    'Enterprise',
    'enterprise',
    'Complete solution for large hospitals',
    199.99,
    'monthly',
    '{
      "patient_management": true,
      "appointment_scheduling": true,
      "basic_reporting": true,
      "email_notifications": true,
      "electronic_prescriptions": true,
      "advanced_analytics": true,
      "telemedicine": true,
      "api_access": true,
      "custom_branding": true,
      "priority_support": true
    }',
    100,
    100
  )
ON CONFLICT (key) DO NOTHING;

-- Update licenses table to ensure it has the necessary fields
DO $$ 
BEGIN
  -- Make sure billing_info exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'licenses' 
    AND column_name = 'billing_info'
  ) THEN
    ALTER TABLE licenses 
    ADD COLUMN billing_info jsonb;
  END IF;
END $$;

-- Create a function to handle license upgrades
CREATE OR REPLACE FUNCTION upgrade_license(
  license_id uuid,
  new_plan_id uuid,
  billing_cycle text,
  payment_method text DEFAULT 'credit_card'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date timestamp with time zone := now();
  end_date timestamp with time zone;
  plan_record record;
  final_price numeric;
  updated_license_id uuid;
BEGIN
  -- Get plan details
  SELECT * INTO plan_record FROM pricing_plans WHERE id = new_plan_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;
  
  -- Calculate end date based on billing cycle
  IF billing_cycle = 'monthly' THEN
    end_date := start_date + interval '1 month';
    final_price := plan_record.price;
  ELSIF billing_cycle = 'yearly' THEN
    end_date := start_date + interval '1 year';
    final_price := plan_record.price * 12 * 0.8; -- 20% discount
  ELSIF billing_cycle = 'lifetime' THEN
    end_date := NULL; -- No end date for lifetime
    final_price := plan_record.price * 12 * 5 * 0.6; -- 5 years at 40% discount
  ELSE
    RAISE EXCEPTION 'Invalid billing cycle';
  END IF;
  
  -- Update the license
  UPDATE licenses
  SET 
    plan_id = new_plan_id,
    start_date = start_date,
    end_date = end_date,
    status = 'active',
    max_users = plan_record.max_users,
    features = plan_record.features,
    billing_info = jsonb_build_object(
      'billing_cycle', billing_cycle,
      'price', final_price,
      'payment_method', payment_method,
      'auto_renew', (billing_cycle != 'lifetime'),
      'next_invoice_date', end_date
    )
  WHERE id = license_id
  RETURNING id INTO updated_license_id;
  
  RETURN updated_license_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upgrade_license TO authenticated;