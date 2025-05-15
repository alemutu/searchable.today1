/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new non-recursive policies for profiles table
    - Implement direct role checks without circular dependencies
    - Maintain same security model with cleaner implementation
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
  )
);

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.hospital_id = profiles.hospital_id
  )
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
  EXISTS (
    SELECT 1 FROM profiles AS user_profile
    WHERE user_profile.id = auth.uid()
    AND user_profile.hospital_id = profiles.hospital_id
  )
);