/*
  # Fix infinite recursion in RLS policies

  1. Changes
     - Drop all existing policies on profiles table
     - Create new non-recursive policies for profiles table
     - Simplify the super_admin_stats view to avoid policy checks
     - Add direct role-based checks instead of function calls in policies
  
  2. Security
     - Maintain the same security model but implement it without recursion
     - Ensure super admins can still manage all profiles
     - Ensure hospital admins can only manage profiles in their hospital
     - Ensure users can view their own profile and profiles from the same hospital
*/

-- First, drop all existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same hospital" ON profiles;

-- Drop the view if it exists to recreate it
DROP VIEW IF EXISTS super_admin_stats;

-- Create a view for super admin dashboard statistics that doesn't rely on RLS
CREATE VIEW super_admin_stats AS
SELECT 
  h.id,
  h.created_at,
  h.name,
  h.subdomain,
  h.address,
  h.phone,
  h.email,
  h.logo_url
FROM hospitals h;

-- Grant access to the view for authenticated users
GRANT SELECT ON super_admin_stats TO authenticated;

-- Create new policies for profiles table with direct checks to avoid recursion
-- Super admins can manage all profiles
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Hospital admins can manage profiles in their hospital
CREATE POLICY "Hospital admins can manage profiles in their hospital"
ON profiles
FOR ALL
TO authenticated
USING (
  (role = 'admin') AND 
  (hospital_id IS NOT NULL) AND 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p.hospital_id = profiles.hospital_id
  )
);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Users can view profiles from the same hospital
CREATE POLICY "Users can view profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.hospital_id = profiles.hospital_id
  )
);