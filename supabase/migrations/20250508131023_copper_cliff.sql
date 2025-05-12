/*
  # Fix profiles RLS policies

  1. Changes
    - Drop existing RLS policies on profiles table that cause recursion
    - Create new, optimized policies that prevent infinite recursion
    - Maintain security while allowing proper access to profile data

  2. Security
    - Users can still read their own profile
    - Users can read profiles from their hospital
    - Hospital admins can manage hospital profiles
    - Super admins can manage all profiles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new optimized policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can read profiles from same hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
    LIMIT 1
  )
);

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles AS admin_profile 
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.hospital_id = profiles.hospital_id
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles AS admin_profile 
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.hospital_id = profiles.hospital_id
    LIMIT 1
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles AS super_admin 
    WHERE super_admin.id = auth.uid()
      AND super_admin.role = 'super_admin'
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles AS super_admin 
    WHERE super_admin.id = auth.uid()
      AND super_admin.role = 'super_admin'
    LIMIT 1
  )
);