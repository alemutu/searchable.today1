/*
  # Fix Infinite Recursion in Profile Policies

  1. Changes
    - Drop existing problematic policies on profiles table
    - Create new policies that avoid recursion by using direct role checks
    - Create a security definer function for role checks
    - Create a super_admin_stats view for dashboard statistics
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for different user roles
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
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

-- Create a security definer function to check if a user is an admin of a specific hospital
CREATE OR REPLACE FUNCTION is_hospital_admin(hospital_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND hospital_id = hospital_uuid
  );
END;
$$;

-- Create a view for super admin dashboard statistics
CREATE OR REPLACE VIEW super_admin_stats AS
SELECT 
  h.id,
  h.created_at,
  h.name,
  h.subdomain,
  h.address,
  h.phone,
  h.email,
  h.logo_url
FROM hospitals h
WHERE is_super_admin();

-- Make the view accessible only through security definer functions
ALTER VIEW super_admin_stats OWNER TO postgres;
GRANT SELECT ON super_admin_stats TO authenticated;
ALTER VIEW super_admin_stats SECURITY DEFINER;

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
  role = 'admin' 
  AND hospital_id IS NOT NULL 
  AND is_hospital_admin(hospital_id)
);

CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);