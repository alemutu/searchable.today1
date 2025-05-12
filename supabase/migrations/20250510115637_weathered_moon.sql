/*
  # Add Domain Support for Hospitals
  
  1. Changes
    - Add domain_enabled field to hospitals table
    - Add main_domain field to system_settings table
    - Create function to generate full domain URL
    
  2. Security
    - Maintain existing RLS policies
    - Only super admins can manage domain settings
*/

-- Add domain_enabled field to hospitals table
ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS domain_enabled boolean DEFAULT true;

-- Add main_domain to system_settings if it doesn't exist
INSERT INTO system_settings (key, value, description)
VALUES (
  'system.main_domain',
  '"searchable.today"',
  'Main domain for hospital subdomains'
)
ON CONFLICT (key) DO UPDATE
SET value = '"searchable.today"';

-- Create function to generate full domain URL
CREATE OR REPLACE FUNCTION get_hospital_domain(hospital_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subdomain text;
  main_domain text;
BEGIN
  -- Get the hospital subdomain
  SELECT h.subdomain INTO subdomain
  FROM hospitals h
  WHERE h.id = hospital_id;
  
  -- Get the main domain from system settings
  SELECT value::text INTO main_domain
  FROM system_settings
  WHERE key = 'system.main_domain';
  
  -- Remove quotes from the JSON string
  main_domain := trim(both '"' from main_domain);
  
  -- Return the full domain
  RETURN subdomain || '.' || main_domain;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_hospital_domain TO authenticated;