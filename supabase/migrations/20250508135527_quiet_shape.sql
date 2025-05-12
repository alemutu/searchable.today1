/*
  # Fix profiles policies

  1. Changes
    - Drop existing policies that may cause infinite recursion
    - Create new policies with optimized conditions
    - Fix syntax error with current_user keyword
  
  2. Security
    - Maintain same security model:
      - Users can read their own profiles
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
    - Avoid recursive checks that could cause infinite recursion
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new, more efficient policies
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
  -- Check if the current user is an admin and in the same hospital
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
  -- Direct check for super admin role
  EXISTS (
    SELECT 1
    FROM profiles AS admin_profiles
    WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'super_admin'
  )
);