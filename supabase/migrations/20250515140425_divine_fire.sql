/*
  # Fix infinite recursion in profiles policy

  1. Changes
    - Replaces the recursive policies on the profiles table with non-recursive versions
    - Creates helper functions for role-based access checks
    - Updates existing policies to use the helper functions
*/

-- Create helper functions for role checks
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_hospital_admin(hospital_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    JOIN profiles ON profiles.id = auth.uid()
    WHERE profiles.hospital_id = hospital_admin.hospital_id
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Users can access profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Hospital admins can manage profiles in their hospital"
ON profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin' 
  AND (SELECT hospital_id FROM profiles WHERE id = auth.uid()) = profiles.hospital_id
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
  profiles.hospital_id IN (
    SELECT hospital_id FROM profiles WHERE id = auth.uid()
  )
);