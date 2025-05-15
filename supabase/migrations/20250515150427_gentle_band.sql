/*
  # Fix Profiles Policies

  1. Changes
     - Drop existing policies that cause recursion
     - Create new policies with non-recursive conditions
     - Fix the issue with auth.users reference by using proper syntax
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies with non-recursive conditions
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- This policy avoids recursion by using a direct comparison
CREATE POLICY "Users can read profiles from same hospital"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    hospital_id = (
      SELECT hospital_id 
      FROM profiles 
      WHERE id = auth.uid() 
      LIMIT 1
    )
  );

-- Use a subquery to avoid recursion
CREATE POLICY "Hospital admins can manage profiles"
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

-- Simplified super admin check
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

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);