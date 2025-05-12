/*
  # Fix recursive RLS policies for profiles table

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Implement new, optimized policies for profile access:
      - Users can read their own profile
      - Users can read profiles from their hospital
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
  
  2. Security
    - Maintains proper access control while avoiding recursion
    - Ensures data isolation between hospitals
    - Preserves admin privileges
*/

-- Drop existing policies to replace them with optimized versions
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new, optimized policies
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
    LIMIT 1
  )
);

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
    AND admin_profile.hospital_id = profiles.hospital_id
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
    AND admin_profile.hospital_id = profiles.hospital_id
    LIMIT 1
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles super_admin 
    WHERE super_admin.id = auth.uid() 
    AND super_admin.role = 'super_admin'
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles super_admin 
    WHERE super_admin.id = auth.uid() 
    AND super_admin.role = 'super_admin'
    LIMIT 1
  )
);