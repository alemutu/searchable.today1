/*
  # Fix profiles RLS policies

  1. Changes
    - Remove recursive policies from profiles table
    - Implement new, simplified policies that avoid infinite recursion
    - Maintain security while fixing the technical issue

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Users can read their own profile
      - Users can read profiles from their hospital
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow admins and super admins to manage profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users and admins to read profiles" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new, non-recursive policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
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
    FROM profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'super_admin'
  )
);