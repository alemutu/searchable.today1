/*
  # Create system modules table

  1. New Tables
    - `system_modules` - System module configuration
    - `module_permissions` - Role-based permissions for modules
    
  2. Security
    - Enable RLS on all tables
    - Add policies for super admin access
*/

-- Create system_modules table
CREATE TABLE IF NOT EXISTS system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  version text NOT NULL
);

-- Create module_permissions table
CREATE TABLE IF NOT EXISTS module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  module_id uuid NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
  role text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for system_modules
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

-- Create policies for module_permissions
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

-- Add trigger for updated_at
CREATE TRIGGER update_system_modules_updated_at
  BEFORE UPDATE ON system_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_permissions_updated_at
  BEFORE UPDATE ON module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default system modules
INSERT INTO system_modules (name, key, description, version)
VALUES
  ('Patient Management', 'patient_management', 'Core patient registration and management', '1.0.0'),
  ('Appointments', 'appointments', 'Appointment scheduling and management', '1.0.0'),
  ('Billing', 'billing', 'Invoicing and payment processing', '1.0.0'),
  ('Pharmacy', 'pharmacy', 'Medication dispensing and inventory', '1.0.0'),
  ('Laboratory', 'laboratory', 'Lab test ordering and results', '1.0.0'),
  ('Radiology', 'radiology', 'Imaging studies and reports', '1.0.0'),
  ('Inpatient', 'inpatient', 'Inpatient ward management', '1.0.0'),
  ('Reports', 'reports', 'Analytics and reporting', '1.0.0'),
  ('User Management', 'user_management', 'User and role management', '1.0.0'),
  ('Settings', 'settings', 'System configuration', '1.0.0')
ON CONFLICT (key) DO NOTHING;

-- Insert default module permissions
INSERT INTO module_permissions (module_id, role, permissions)
SELECT 
  id as module_id,
  'admin',
  '{"create": true, "read": true, "update": true, "delete": true}'::jsonb
FROM system_modules
ON CONFLICT DO NOTHING;

INSERT INTO module_permissions (module_id, role, permissions)
SELECT 
  id as module_id,
  'doctor',
  '{"create": true, "read": true, "update": true, "delete": false}'::jsonb
FROM system_modules
ON CONFLICT DO NOTHING;

INSERT INTO module_permissions (module_id, role, permissions)
SELECT 
  id as module_id,
  'nurse',
  '{"create": true, "read": true, "update": true, "delete": false}'::jsonb
FROM system_modules
ON CONFLICT DO NOTHING;

INSERT INTO module_permissions (module_id, role, permissions)
SELECT 
  id as module_id,
  'receptionist',
  '{"create": true, "read": true, "update": true, "delete": false}'::jsonb
FROM system_modules
ON CONFLICT DO NOTHING;