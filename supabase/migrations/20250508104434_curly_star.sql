/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies that cause recursion
    - Create new, optimized policies for the profiles table that avoid recursion
    
  2. Security
    - Enable RLS on profiles table (in case it was disabled)
    - Add policies for:
      - Users can read their own profile
      - Users can read profiles from their hospital
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new, optimized policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles my_profile
    WHERE my_profile.id = auth.uid()
    AND my_profile.hospital_id = profiles.hospital_id
  )
);

CREATE POLICY "Hospital admins can manage profiles"
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

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles super_admin_profile
    WHERE super_admin_profile.id = auth.uid()
    AND super_admin_profile.role = 'super_admin'
  )
);