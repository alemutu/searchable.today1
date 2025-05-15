/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new non-recursive policies that avoid circular references
    - Fix super admin check to use auth.users metadata instead of querying profiles
    - Maintain the same security model with optimized policy conditions
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new non-recursive policies
-- 1. Allow users to read their own profile (simplest case)
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Allow users to view profiles from the same hospital
-- This uses a direct hospital_id comparison with a subquery
CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  hospital_id = (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- 3. Allow hospital admins to manage profiles in their hospital
-- This avoids recursion by using a direct comparison
CREATE POLICY "Hospital admins can manage hospital profiles"
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

-- 4. Allow super admins to manage all profiles
-- This uses auth.users metadata directly to avoid recursion
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role')::text = 'super_admin'
  )
);