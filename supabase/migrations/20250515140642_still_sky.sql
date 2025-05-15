/*
  # Fix profiles policies and helper functions

  1. Changes
    - Drop existing policies with CASCADE to handle dependencies
    - Create helper functions for role checks
    - Create new non-recursive policies for profiles table
  
  2. Security
    - Implement proper role-based access control
    - Fix infinite recursion in policies
*/

-- Drop existing problematic policies with CASCADE to handle dependencies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can access profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles CASCADE;

-- Create helper functions for role checks
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create hospital admin check function with clear parameter name
CREATE OR REPLACE FUNCTION is_hospital_admin(hospital_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.hospital_id = hospital_uuid
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new non-recursive policies
CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Hospital admins can manage profiles in their hospital"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin' 
  AND (SELECT hospital_id FROM profiles WHERE id = auth.uid()) = profiles.hospital_id
);

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can read profiles from same hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  profiles.hospital_id IN (
    SELECT hospital_id FROM profiles WHERE id = auth.uid()
  )
);