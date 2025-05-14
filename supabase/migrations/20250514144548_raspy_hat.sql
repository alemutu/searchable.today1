/*
  # Hospital Onboarding Tables

  1. New Tables
    - `hospital_modules` - Tracks which modules are enabled for each hospital
    - `hospital_users` - Maps users to hospitals with roles
    - `pricing_plans` - Defines available pricing plans
    - `licenses` - Tracks license information for each hospital
    - `license_history` - Records license changes over time

  2. Security
    - Enable RLS on all tables
    - Add policies for super admins and hospital admins
*/

-- Hospital Modules table
CREATE TABLE IF NOT EXISTS hospital_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hospital_modules_hospital_id_idx ON hospital_modules(hospital_id);
CREATE INDEX IF NOT EXISTS hospital_modules_module_key_idx ON hospital_modules(module_key);
CREATE UNIQUE INDEX IF NOT EXISTS hospital_modules_hospital_module_idx ON hospital_modules(hospital_id, module_key);

-- Hospital Users table (for tracking user-hospital relationships)
CREATE TABLE IF NOT EXISTS hospital_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hospital_users_hospital_id_idx ON hospital_users(hospital_id);
CREATE INDEX IF NOT EXISTS hospital_users_user_id_idx ON hospital_users(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS hospital_users_hospital_user_idx ON hospital_users(hospital_id, user_id);

-- Pricing Plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('month', 'year')),
  features jsonb[] DEFAULT ARRAY[]::jsonb[],
  is_active boolean DEFAULT true,
  max_users integer NOT NULL CHECK (max_users > 0),
  max_storage_gb integer NOT NULL CHECK (max_storage_gb > 0),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pricing_plans_key_key ON pricing_plans(key);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES pricing_plans(id),
  start_date date NOT NULL,
  end_date date CHECK (end_date > start_date),
  status text NOT NULL CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
  max_users integer NOT NULL CHECK (max_users > 0),
  current_users integer NOT NULL DEFAULT 0 CHECK (current_users >= 0),
  features jsonb DEFAULT '{}'::jsonb,
  billing_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS licenses_hospital_id_idx ON licenses(hospital_id);
CREATE INDEX IF NOT EXISTS licenses_plan_id_idx ON licenses(plan_id);
CREATE INDEX IF NOT EXISTS licenses_status_idx ON licenses(status);

-- License History table
CREATE TABLE IF NOT EXISTS license_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES pricing_plans(id),
  change_type text NOT NULL,
  previous_status text,
  new_status text,
  previous_plan_id uuid REFERENCES pricing_plans(id),
  previous_end_date date,
  new_end_date date,
  changed_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS license_history_license_id_idx ON license_history(license_id);
CREATE INDEX IF NOT EXISTS license_history_hospital_id_idx ON license_history(hospital_id);

-- Enable Row Level Security
ALTER TABLE hospital_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_history ENABLE ROW LEVEL SECURITY;

-- Super Admin Policies
CREATE POLICY "Super admins can manage hospital modules" 
  ON hospital_modules FOR ALL 
  TO authenticated 
  USING (is_super_admin());

CREATE POLICY "Super admins can manage hospital users" 
  ON hospital_users FOR ALL 
  TO authenticated 
  USING (is_super_admin());

CREATE POLICY "Super admins can manage pricing plans" 
  ON pricing_plans FOR ALL 
  TO authenticated 
  USING (is_super_admin());

CREATE POLICY "Super admins can manage licenses" 
  ON licenses FOR ALL 
  TO authenticated 
  USING (is_super_admin());

CREATE POLICY "Super admins can manage license history" 
  ON license_history FOR ALL 
  TO authenticated 
  USING (is_super_admin());

-- Hospital Admin Policies
CREATE POLICY "Hospital admins can read their modules" 
  ON hospital_modules FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.hospital_id = hospital_modules.hospital_id
    )
  );

CREATE POLICY "Hospital admins can read their users" 
  ON hospital_users FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.hospital_id = hospital_users.hospital_id
    )
  );

CREATE POLICY "Hospital admins can read their license" 
  ON licenses FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.hospital_id = licenses.hospital_id
    )
  );

-- Insert default pricing plans
INSERT INTO pricing_plans (name, key, description, price, billing_cycle, features, max_users, max_storage_gb)
VALUES
  ('Starter', 'starter', 'Basic outpatient management', 99, 'month', ARRAY['{"feature": "Patient Registration", "included": true}', '{"feature": "Consultations", "included": true}', '{"feature": "Pharmacy", "included": true}', '{"feature": "Billing", "included": true}']::jsonb[], 5, 10),
  ('Professional', 'pro', 'Complete outpatient and inpatient management', 299, 'month', ARRAY['{"feature": "All Starter Features", "included": true}', '{"feature": "Inpatient Management", "included": true}', '{"feature": "Lab & Radiology", "included": true}', '{"feature": "Advanced Reporting", "included": true}']::jsonb[], 20, 50),
  ('Enterprise', 'enterprise', 'Full hospital management solution', 599, 'month', ARRAY['{"feature": "All Professional Features", "included": true}', '{"feature": "Unlimited Users", "included": true}', '{"feature": "All Add-ons Included", "included": true}', '{"feature": "Priority Support", "included": true}']::jsonb[], 100, 500),
  ('Custom', 'custom', 'Tailored to your specific needs', 199, 'month', ARRAY['{"feature": "Custom Module Selection", "included": true}', '{"feature": "Flexible User Limits", "included": true}', '{"feature": "Personalized Support", "included": true}']::jsonb[], 10, 25)
ON CONFLICT (key) DO NOTHING;

-- Create helper function for license management
CREATE OR REPLACE FUNCTION upgrade_license(
  license_id uuid,
  new_plan_id uuid,
  billing_cycle text DEFAULT 'monthly'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_license licenses;
  v_plan pricing_plans;
  v_end_date date;
BEGIN
  -- Get current license
  SELECT * INTO v_license FROM licenses WHERE id = license_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'License not found';
  END IF;
  
  -- Get new plan
  SELECT * INTO v_plan FROM pricing_plans WHERE id = new_plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;
  
  -- Calculate new end date based on billing cycle
  IF billing_cycle = 'yearly' THEN
    v_end_date := (CURRENT_DATE + INTERVAL '1 year')::date;
  ELSIF billing_cycle = 'monthly' THEN
    v_end_date := (CURRENT_DATE + INTERVAL '1 month')::date;
  ELSE
    v_end_date := NULL; -- Lifetime license
  END IF;
  
  -- Record history
  INSERT INTO license_history (
    license_id,
    hospital_id,
    plan_id,
    change_type,
    previous_status,
    new_status,
    previous_plan_id,
    previous_end_date,
    new_end_date,
    changed_by,
    notes
  ) VALUES (
    v_license.id,
    v_license.hospital_id,
    new_plan_id,
    'upgrade',
    v_license.status,
    'active',
    v_license.plan_id,
    v_license.end_date,
    v_end_date,
    auth.uid(),
    'Plan upgraded from ' || v_license.plan_id || ' to ' || new_plan_id
  );
  
  -- Update license
  UPDATE licenses
  SET 
    plan_id = new_plan_id,
    status = 'active',
    end_date = v_end_date,
    max_users = v_plan.max_users,
    features = v_plan.features,
    billing_info = jsonb_set(
      billing_info, 
      '{billing_cycle}', 
      to_jsonb(billing_cycle)
    )
  WHERE id = license_id;
  
  RETURN true;
END;
$$;

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;