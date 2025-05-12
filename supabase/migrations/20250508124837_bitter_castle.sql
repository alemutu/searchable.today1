/*
  # Super Admin System Schema
  
  1. New Tables
    - system_settings: Global configuration settings
    - admin_audit_logs: Audit trail for admin actions
  
  2. Functions
    - is_super_admin: Check if a user has super admin role
    - log_admin_action: Log administrative actions
    
  3. Views
    - super_admin_stats: Dashboard statistics for super admins
    
  4. Security
    - RLS policies for all tables
    - Function security with SECURITY DEFINER
*/

-- Create system_settings table for global configurations
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only super admins to manage system settings
CREATE POLICY "Super admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role = 'super_admin'
  );
$$;

-- Create view for super admin dashboard statistics
CREATE OR REPLACE VIEW super_admin_stats AS
SELECT
  (SELECT count(*) FROM hospitals) as total_hospitals,
  (SELECT count(*) FROM profiles WHERE role != 'super_admin') as total_users,
  (SELECT count(*) FROM patients) as total_patients,
  (SELECT count(*) FROM departments) as total_departments,
  (SELECT count(*) FROM profiles WHERE role = 'doctor') as total_doctors,
  (SELECT count(*) FROM profiles WHERE role = 'nurse') as total_nurses;

-- Create audit log table for super admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  changes jsonb NOT NULL,
  ip_address text,
  user_agent text
);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only super admins to view audit logs
CREATE POLICY "Super admins can view audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_id_idx ON admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_entity_type_idx ON admin_audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON admin_audit_logs (created_at);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action text,
  entity_type text,
  entity_id uuid,
  changes jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can log actions';
  END IF;

  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    changes,
    ip_address,
    user_agent
  )
  VALUES (
    auth.uid(),
    action,
    entity_type,
    entity_id,
    changes,
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent'
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;