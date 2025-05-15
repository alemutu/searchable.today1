/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop existing policies that cause recursion
    - Create new policies with non-recursive conditions
    - Maintain the same security model but with optimized queries
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

-- This policy uses a direct comparison instead of a subquery to avoid recursion
CREATE POLICY "Users can read profiles from same hospital"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'hospital_id')::uuid = profiles.hospital_id
    )
  );

-- Use auth.users metadata for role checks instead of profiles table
CREATE POLICY "Hospital admins can manage profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.users.raw_user_meta_data->>'role')::text = 'admin' 
    AND (auth.users.raw_user_meta_data->>'hospital_id')::uuid = profiles.hospital_id
  );

-- Simplified super admin check
CREATE POLICY "Super admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.users.raw_user_meta_data->>'role')::text = 'super_admin'
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);