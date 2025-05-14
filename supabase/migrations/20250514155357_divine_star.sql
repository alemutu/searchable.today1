/*
  # License Settings Table

  1. New Tables
    - `license_settings` - Global settings for license management
  
  2. Security
    - Enable RLS on `license_settings` table
    - Add policy for super admins to manage license settings
*/

-- Create license settings table
CREATE TABLE IF NOT EXISTS license_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grace_period_monthly integer NOT NULL DEFAULT 7,
  grace_period_yearly integer NOT NULL DEFAULT 14,
  auto_renew_default boolean NOT NULL DEFAULT true,
  send_expiry_reminders boolean NOT NULL DEFAULT true,
  reminder_days integer[] NOT NULL DEFAULT ARRAY[30, 14, 7, 3, 1],
  notification_templates jsonb NOT NULL DEFAULT '{
    "expiry_reminder": "Your license will expire in {{days}} days. Please renew to avoid service interruption.",
    "grace_period_notice": "Your license has expired but you are in a grace period of {{days}} days. Please renew as soon as possible.",
    "license_expired": "Your license has expired. Please renew to regain access to the system."
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create system_modules table
CREATE TABLE IF NOT EXISTS system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  description text,
  category text NOT NULL,
  is_core boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  version text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE license_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;

-- Super Admin Policies
CREATE POLICY "Super admins can manage license settings" 
  ON license_settings FOR ALL 
  TO authenticated 
  USING (is_super_admin());

CREATE POLICY "Super admins can manage system modules" 
  ON system_modules FOR ALL 
  TO authenticated 
  USING (is_super_admin());

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for license_settings
CREATE TRIGGER update_license_settings_updated_at
BEFORE UPDATE ON license_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for system_modules
CREATE TRIGGER update_system_modules_updated_at
BEFORE UPDATE ON system_modules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default system modules
INSERT INTO system_modules (name, key, category, is_core, is_active, version, description)
VALUES
  ('Patient Registration', 'patient_registration', 'outpatient', true, true, '1.0.0', 'Register and manage patient profiles'),
  ('Appointments', 'appointments', 'outpatient', true, true, '1.0.0', 'Schedule and manage appointments'),
  ('Consultations', 'consultations', 'outpatient', true, true, '1.0.0', 'Record patient consultations and diagnoses'),
  ('Pharmacy', 'pharmacy', 'outpatient', true, true, '1.0.0', 'Manage prescriptions and medication dispensing'),
  ('Billing', 'billing', 'outpatient', true, true, '1.0.0', 'Process payments and generate invoices'),
  ('Queue Management', 'queue_management', 'outpatient', false, true, '1.0.0', 'Manage patient queues and wait times'),
  
  ('Admissions', 'admissions', 'inpatient', true, true, '1.0.0', 'Manage patient admissions'),
  ('Bed Management', 'bed_management', 'inpatient', true, true, '1.0.0', 'Track and assign hospital beds'),
  ('Nurse Station', 'nurse_station', 'inpatient', true, true, '1.0.0', 'Nursing workflow and patient care'),
  ('Discharge Planning', 'discharge', 'inpatient', true, true, '1.0.0', 'Plan and process patient discharges'),
  ('Ward Rounds', 'ward_rounds', 'inpatient', false, true, '1.0.0', 'Track doctor rounds and patient visits'),
  
  ('Laboratory', 'laboratory', 'shared', true, true, '1.0.0', 'Manage lab tests and results'),
  ('Radiology', 'radiology', 'shared', true, true, '1.0.0', 'Manage imaging studies and reports'),
  ('Reports', 'reports', 'shared', true, true, '1.0.0', 'Generate clinical and administrative reports'),
  ('Inventory', 'inventory', 'shared', false, true, '1.0.0', 'Track medical supplies and equipment'),
  ('HR Management', 'hr', 'shared', false, true, '1.0.0', 'Manage staff and human resources'),
  
  ('Telemedicine', 'telemedicine', 'addon', false, true, '1.0.0', 'Virtual consultations and remote care'),
  ('AI Assistant', 'ai_assistant', 'addon', false, true, '1.0.0', 'AI-powered clinical decision support'),
  ('Insurance Integration', 'insurance', 'addon', false, true, '1.0.0', 'Connect with insurance providers'),
  ('Doctor Portal', 'doctor_portal', 'addon', false, true, '1.0.0', 'Dedicated interface for physicians'),
  ('Patient Mobile App', 'patient_app', 'addon', false, true, '1.0.0', 'Mobile application for patients')
ON CONFLICT (key) DO NOTHING;