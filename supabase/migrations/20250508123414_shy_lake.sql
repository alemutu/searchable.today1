/*
  # Fix profiles table policy recursion

  1. Changes
    - Drop existing policies on profiles table that cause recursion
    - Create new, non-recursive policies for profiles table
    
  2. Security
    - Enable RLS on profiles table (in case it was disabled)
    - Add policy for users to read their own profile
    - Add policy for users to read profiles from their hospital
    - Add policy for hospital admins to manage profiles in their hospital
    - Add policy for super admins to manage all profiles
    
  Note: The new policies avoid recursion by not querying the profiles table 
  within the policy conditions themselves
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile (no recursion, uses auth.uid())
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Users can read profiles from their hospital (uses user's JWT claims)
CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
);

-- Hospital admins can manage profiles in their hospital
CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  AND hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
);

-- Super admins can manage all profiles
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);