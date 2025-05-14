/*
  # Add Super Admin Module Management
  
  1. New Tables
    - `system_modules` - Track available system modules
    - `module_permissions` - Define role-based access to modules
    - `pricing_plans` - Define system pricing plans
    - `licenses` - Track user licenses
    - `support_tickets` - Manage support tickets
    
  2. Security
    - Enable RLS on all tables
    - Add policies for super admin access
*/

-- Create system_modules table
CREATE TABLE IF NOT EXISTS system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  version text,
  dependencies jsonb[]
);

-- Create module_permissions table
CREATE TABLE IF NOT EXISTS module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  module_id uuid REFERENCES system_modules(id) ON DELETE CASCADE,
  role text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(module_id, role)
);

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  billing_cycle text NOT NULL,
  features jsonb NOT NULL,
  is_active boolean DEFAULT true,
  max_users int,
  max_storage_gb int
);

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES pricing_plans(id),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  status text NOT NULL,
  max_users int,
  current_users int DEFAULT 0,
  features jsonb,
  billing_info jsonb,
  
  CONSTRAINT valid_license_status CHECK (status IN ('active', 'expired', 'suspended', 'cancelled'))
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL,
  status text NOT NULL,
  category text NOT NULL,
  resolution text,
  resolved_at timestamptz,
  
  CONSTRAINT valid_ticket_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_ticket_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'reopened'))
);

-- Enable RLS on all tables
ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for super admin access
CREATE POLICY "Super admins can manage system modules"
  ON system_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage module permissions"
  ON module_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage pricing plans"
  ON pricing_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage licenses"
  ON licenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create policies for support tickets
CREATE POLICY "Hospital staff can view their tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS system_modules_key_idx ON system_modules (key);
CREATE INDEX IF NOT EXISTS pricing_plans_key_idx ON pricing_plans (key);
CREATE INDEX IF NOT EXISTS licenses_hospital_id_idx ON licenses (hospital_id);
CREATE INDEX IF NOT EXISTS licenses_status_idx ON licenses (status);
CREATE INDEX IF NOT EXISTS support_tickets_hospital_id_idx ON support_tickets (hospital_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_priority_idx ON support_tickets (priority);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for support_tickets
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();