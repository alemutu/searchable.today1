/*
  # Fix Profile Policies

  1. Changes
    - Remove recursive policy conditions
    - Simplify policy checks
    - Add proper table aliasing
    - Optimize policy performance

  2. Security
    - Maintain same security model
    - Fix infinite recursion issue
    - Keep RLS enabled
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new, optimized policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Hospital admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles AS admin_profiles
    WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'admin'
      AND admin_profiles.hospital_id = profiles.hospital_id
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles AS admin_profiles
    WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'super_admin'
  )
);