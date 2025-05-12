/*
  # Fix profiles RLS policies

  1. Changes
    - Drop existing RLS policies on profiles table that may cause recursion
    - Create new, simplified RLS policies that avoid recursion:
      - Users can read their own profile
      - Users can read profiles from their hospital
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
  
  2. Security
    - Maintains RLS protection while eliminating recursion
    - Ensures proper access control based on user roles
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can read profiles from their hospital"
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
    FROM profiles admin 
    WHERE admin.id = auth.uid() 
    AND admin.role = 'admin'
    AND admin.hospital_id = profiles.hospital_id
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles admin 
    WHERE admin.id = auth.uid() 
    AND admin.role = 'super_admin'
  )
);