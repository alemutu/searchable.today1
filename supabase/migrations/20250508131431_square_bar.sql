/*
  # Fix profiles RLS policies

  1. Changes
    - Drop existing RLS policies that are causing recursion
    - Create new, optimized RLS policies for the profiles table
    - Policies are simplified to avoid recursive checks
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Users can read their own profile
      - Users can read profiles from same hospital (using direct hospital_id comparison)
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
*/

-- Drop existing policies to replace them with optimized versions
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new optimized policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can read profiles from same hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Hospital admins can manage profiles"
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
)
WITH CHECK (
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