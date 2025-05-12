/*
  # Fix profiles table policies

  1. Changes
    - Remove recursive policies that cause infinite loops
    - Add simplified policies for profile access:
      - Users can read their own profile
      - Users can read profiles from their hospital
      - Hospital admins can manage hospital profiles
      - Super admins can manage all profiles

  2. Security
    - Maintain RLS on profiles table
    - Ensure proper access control based on user roles and hospital association
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can read profiles from same hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  hospital_id = (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles FOR ALL
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
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles admin 
    WHERE admin.id = auth.uid() 
    AND admin.role = 'super_admin'
  )
);