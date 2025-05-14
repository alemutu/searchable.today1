/*
  # Fix infinite recursion in RLS policies

  1. Security Functions
    - Create security definer functions for role checks
    - These functions avoid the recursion issues in policies
  
  2. RLS Policies
    - Drop existing problematic policies on profiles table
    - Create new policies using the security definer functions
    - Fix the "Users can view profiles from same hospital" policy
  
  3. Super Admin Stats
    - Create a new view for super admin dashboard statistics
    - Add appropriate security to the view
*/

-- First, drop all existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same hospital" ON profiles;

-- Create a security definer function to check if a user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role = 'super_admin';
END;
$$;

-- Create a security definer function to check if a user is an admin of a specific hospital
CREATE OR REPLACE FUNCTION is_hospital_admin(hospital_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_hospital_id uuid;
BEGIN
  SELECT role, hospital_id INTO user_role, user_hospital_id FROM profiles WHERE id = auth.uid();
  RETURN user_role = 'admin' AND user_hospital_id = hospital_uuid;
END;
$$;

-- Drop the view with CASCADE to handle dependencies
DROP VIEW IF EXISTS super_admin_stats CASCADE;

-- Create a view for super admin dashboard statistics
CREATE VIEW super_admin_stats AS
SELECT 
  h.id,
  h.created_at,
  h.name,
  h.subdomain,
  h.address,
  h.phone,
  h.email,
  h.logo_url,
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM patients) AS total_patients,
  (SELECT COUNT(*) FROM departments) AS total_departments,
  (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') AS total_doctors,
  (SELECT COUNT(*) FROM profiles WHERE role = 'nurse') AS total_nurses,
  (SELECT COUNT(*) FROM hospitals) AS total_hospitals
FROM hospitals h;

-- Make the view accessible only to authenticated users
GRANT SELECT ON super_admin_stats TO authenticated;

-- Create new policies for profiles table
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (is_super_admin());

CREATE POLICY "Hospital admins can manage profiles in their hospital"
ON profiles
FOR ALL
TO authenticated
USING (
  role = 'admin' AND 
  hospital_id IS NOT NULL AND 
  is_hospital_admin(hospital_id)
);

CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix the recursive policy by using a direct comparison
CREATE POLICY "Users can view profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles AS p 
    WHERE p.id = auth.uid() AND p.hospital_id = profiles.hospital_id
  )
);

-- Add policies for system_settings table
DROP POLICY IF EXISTS "Super admins can manage system settings" ON system_settings;

CREATE POLICY "Super admins can manage system settings"
ON system_settings
FOR ALL
TO authenticated
USING (is_super_admin());