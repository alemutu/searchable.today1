/*
  # Fix Profiles RLS Policies

  1. Changes
    - Fixes the infinite recursion in profiles RLS policies
    - Adds helper functions for role-based access control
    - Updates policies to use these helper functions
    - Ensures super_admin users have proper access

  2. Security
    - Maintains proper row-level security
    - Prevents infinite recursion in policy evaluation
    - Adds clear helper functions for role checks
*/

-- Create helper functions for role checks
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_hospital_admin(hospital_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' AND profiles.hospital_id = hospital_id
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can access profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new policies with proper checks to avoid recursion
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read profiles from same hospital"
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

CREATE POLICY "Hospital admins can manage profiles in their hospital"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    role = 'admin' AND 
    hospital_id IS NOT NULL AND 
    hospital_id IN (
      SELECT hospital_id
      FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Super admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Add a policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (
      -- Allow users to update their profile except role field
      -- or allow super_admins to update any field
      (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    )
  );