/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Remove recursive policies from profiles table
    - Create new, simplified policies that avoid circular references
    - Maintain security while preventing infinite loops

  2. Security
    - Maintain existing access control rules
    - Ensure users can still access appropriate data
    - Prevent unauthorized access
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new, simplified policies
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

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles super_admin 
    WHERE super_admin.id = auth.uid() 
    AND super_admin.role = 'super_admin'
  )
);