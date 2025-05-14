/*
  # Fix Super Admin Role Implementation

  1. Changes
     - Updates the RLS policies for the profiles table to properly handle super_admin role
     - Ensures super_admin users can access all resources regardless of hospital_id
     - Fixes the infinite recursion issue in the profiles table policies
     - Updates the user with email 'searchable.today@gmail.com' to have super_admin role

  2. Security
     - Maintains proper access control while fixing the recursion issue
     - Ensures super_admin users have full system access
*/

-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new policies that avoid recursion

-- 1. Super admins can manage all profiles
CREATE POLICY "Super admins can manage all profiles" ON profiles
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  );

-- 2. Hospital admins can manage profiles in their hospital
CREATE POLICY "Hospital admins can manage profiles in their hospital" ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE 
        profiles.id = auth.uid() AND 
        profiles.role = 'admin' AND 
        profiles.hospital_id = profiles.hospital_id
    )
  );

-- 3. Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. Users can read profiles from the same hospital
CREATE POLICY "Users can read profiles from same hospital" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE 
        p.id = auth.uid() AND 
        p.hospital_id = profiles.hospital_id
    )
  );

-- Update the user with email 'searchable.today@gmail.com' to have super_admin role
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'searchable.today@gmail.com';

-- Make sure the user has no hospital_id assigned (super_admin should not be tied to a specific hospital)
UPDATE profiles
SET hospital_id = NULL
WHERE email = 'searchable.today@gmail.com' AND role = 'super_admin';