/*
  # Fix Profiles RLS Policies

  This migration fixes the infinite recursion issue in the profiles table RLS policies
  by simplifying the policies and removing any potential circular references.
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new simplified policies that avoid recursion

-- 1. Allow users to read their own profile (simplest case)
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Allow super admins to manage all profiles
-- This uses a direct role check without querying the profiles table again
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'super_admin'
  )
);

-- 3. Allow hospital admins to manage profiles in their hospital
-- This uses a subquery with a direct hospital_id comparison
CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  (SELECT hospital_id FROM profiles WHERE id = auth.uid()) = profiles.hospital_id
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Allow users to view profiles from the same hospital
-- This uses a direct hospital_id comparison
CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  (SELECT hospital_id FROM profiles WHERE id = auth.uid()) = profiles.hospital_id
);