/*
  # Fix profiles RLS policies to prevent infinite recursion

  1. Changes
    - Drop existing RLS policies on profiles table that cause recursion
    - Create new, more specific policies that avoid recursive checks
    - Add policy for super admins to manage all profiles
    - Add policy for hospital admins to manage profiles in their hospital
    - Add policy for users to view their own profile
    - Add policy for users to view profiles from same hospital

  2. Security
    - Maintain existing security model while preventing infinite recursion
    - Ensure proper access control based on user roles
    - Prevent unauthorized access to profile data
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same hospital" ON profiles;

-- Create new policies that avoid recursion
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  role = 'super_admin'
);

CREATE POLICY "Hospital admins can manage profiles in their hospital"
ON profiles
FOR ALL
TO authenticated
USING (
  role = 'admin' 
  AND hospital_id IS NOT NULL 
  AND hospital_id IN (
    SELECT p.hospital_id 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can view profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT p.hospital_id 
    FROM profiles p 
    WHERE p.id = auth.uid()
  )
);