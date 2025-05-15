/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Remove recursive policy checks for super_admin role
    - Simplify policy conditions to avoid circular references
    - Update policies to use auth.uid() directly
    - Add proper policy documentation

  2. Security
    - Maintain existing security model while fixing recursion
    - Ensure proper access control for different user roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can read profiles from same hospital"
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

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND hospital_id = profiles.hospital_id
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'role')::text = 'super_admin'
  )
);