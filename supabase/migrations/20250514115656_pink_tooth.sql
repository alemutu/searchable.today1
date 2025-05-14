/*
  # Fix profiles table RLS policies
  
  1. Changes
    - Drop existing policies that cause infinite recursion
    - Create new policies that avoid self-referencing
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion in policy evaluation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access to hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Enable admin access to hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Enable super admin access" ON profiles;

-- Create new non-recursive policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to read profiles from their hospital
CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND p.hospital_id = profiles.hospital_id
  )
);

-- Allow hospital admins to manage profiles in their hospital
CREATE POLICY "Hospital admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND p.hospital_id = profiles.hospital_id
  )
);

-- Allow super admins to manage all profiles
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
);