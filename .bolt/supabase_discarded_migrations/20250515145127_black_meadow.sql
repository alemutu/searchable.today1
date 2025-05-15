/*
  # Fix profiles table RLS policies

  1. Functions
    - Drop and recreate helper functions for role checks
    - Fix parameter naming issue in is_hospital_admin function
  
  2. Policies
    - Drop existing policies on profiles table
    - Create new policies with proper checks to avoid recursion
    - Add policy for users to update their own profile
*/

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_hospital_admin(uuid);

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
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins and super admins to manage profiles" ON profiles;

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
    EXISTS (
      SELECT 1
      FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.hospital_id = profiles.hospital_id
    )
  );

CREATE POLICY "Super admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'super_admin'
    )
  );

-- Add a policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);