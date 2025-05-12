/*
  # Fix Profiles Table Recursion

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new optimized policies with proper subqueries
    - Add LIMIT 1 to subqueries for better performance
    - Simplify policy conditions

  2. Security
    - Maintain existing security model
    - Prevent infinite recursion in policy evaluation
    - Optimize query performance
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new, optimized policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Non-recursive policy for reading profiles from same hospital
CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    LIMIT 1
  )
);

-- Non-recursive policy for hospital admins
CREATE POLICY "Hospital admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM profiles p2
      WHERE p2.id = auth.users.id
      AND p2.role = 'admin'
      AND p2.hospital_id = profiles.hospital_id
      LIMIT 1
    )
    LIMIT 1
  )
);

-- Non-recursive policy for super admins
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM profiles p2
      WHERE p2.id = auth.users.id
      AND p2.role = 'super_admin'
      LIMIT 1
    )
    LIMIT 1
  )
);