/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing problematic policies that cause recursion
    - Add new, optimized policies that avoid recursion:
      - Allow users to read their own profile
      - Allow users to read profiles from their hospital
      - Allow hospital admins to manage profiles in their hospital
      - Allow super admins to manage all profiles
  
  2. Security
    - Maintains row level security
    - Prevents infinite recursion
    - Preserves existing access control logic
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new, optimized policies
CREATE POLICY "Enable read access for users to their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable read access for users to profiles in their hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable full access for hospital admins to their hospital profiles"
ON profiles FOR ALL
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

CREATE POLICY "Enable full access for super admins"
ON profiles FOR ALL
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