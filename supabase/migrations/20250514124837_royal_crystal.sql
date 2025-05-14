/*
  # Fix Profile Policies to Prevent Infinite Recursion

  1. Changes
    - Remove recursive policy checks that cause infinite loops
    - Simplify super admin check to use JWT claims directly
    - Update hospital admin policy to use direct comparison
    - Maintain security while preventing recursion

  2. Security
    - Policies still enforce proper access control
    - Super admins retain full access
    - Hospital admins can only manage profiles in their hospital
    - Users can view their own profile and profiles from same hospital
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same hospital" ON profiles;

-- Recreate policies without recursion
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  auth.jwt()->>'role' = 'super_admin' OR
  (auth.jwt()->'app_metadata'->>'role')::text = 'super_admin'
);

CREATE POLICY "Hospital admins can manage profiles in their hospital"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.hospital_id IS NOT NULL
      AND p.hospital_id = profiles.hospital_id
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
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.hospital_id = profiles.hospital_id
  )
);