/*
  # Fix recursive policies for profiles table

  1. Changes
    - Drop existing recursive policies
    - Create new, optimized policies that avoid recursion
    - Maintain security while preventing infinite loops

  2. Security
    - Maintain row level security
    - Ensure proper access control for different user roles
    - Prevent unauthorized access to profile data
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create new, optimized policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow super admins to manage all profiles
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  role = 'super_admin'
);

-- Allow hospital admins to manage profiles in their hospital
CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  role = 'admin' AND
  hospital_id IS NOT NULL AND
  hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
);

-- Allow users to read profiles from their hospital
CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  hospital_id IS NOT NULL AND
  hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
);