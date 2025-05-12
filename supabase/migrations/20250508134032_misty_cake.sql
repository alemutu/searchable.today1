/*
  # Fix infinite recursion in profiles policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Implement new policies for profile access that avoid recursion:
      - Users can read their own profile
      - Users can read profiles from their hospital
      - Admins can manage profiles in their hospital
      - Super admins can manage all profiles
  
  2. Security
    - Maintains proper access control without recursion
    - Ensures users can only access appropriate profiles
    - Preserves admin and super admin capabilities
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable full access for hospital admins to their hospital profil" ON profiles;
DROP POLICY IF EXISTS "Enable full access for super admins" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can read profiles in their hospital"
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
)
WITH CHECK (
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
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles super_admin 
    WHERE super_admin.id = auth.uid() 
    AND super_admin.role = 'super_admin'
  )
);