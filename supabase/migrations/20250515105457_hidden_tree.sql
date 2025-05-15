/*
  # System Settings Table and Default Configuration

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `key` (text, unique)
      - `value` (jsonb)
      - `description` (text)
      - `updated_by` (uuid, references profiles)
  2. Security
    - Enable RLS on `system_settings` table
    - Add policy for super admins to manage system settings
  3. Default Settings
    - System name, language, date/time formats
    - Currency, maintenance mode, domain settings
    - Email and security configurations
*/

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for system_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' 
    AND policyname = 'Super admins can manage system settings'
  ) THEN
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
  END IF;
END
$$;

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_system_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON system_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Insert default system settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('system.name', '"Hospital Management System"', 'System name displayed in UI'),
  ('system.language', '"en"', 'Default system language'),
  ('system.date_format', '"YYYY-MM-DD"', 'Default date format'),
  ('system.time_format', '"HH:mm:ss"', 'Default time format'),
  ('system.currency', '"USD"', 'Default currency'),
  ('system.maintenance_mode', 'false', 'System maintenance mode'),
  ('system.main_domain', '"searchable.today"', 'Main domain for hospital subdomains'),
  ('email.smtp_host', '""', 'SMTP server hostname'),
  ('email.smtp_port', '587', 'SMTP server port'),
  ('email.from_address', '""', 'Default from email address'),
  ('security.session_timeout', '3600', 'Session timeout in seconds')
ON CONFLICT (key) DO NOTHING;