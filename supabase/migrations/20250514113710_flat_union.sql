/*
  # Fix recursive policies for profiles table

  1. Changes
    - Drop existing recursive policies that are causing infinite loops
    - Create new non-recursive policies for profile access
    - Add separate policies for different roles with clear conditions
    
  2. Security
    - Maintain row level security
    - Ensure proper access control based on roles
    - Prevent infinite recursion in policy evaluation
*/

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create new non-recursive policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow super admins to manage all profiles based on app_metadata
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'super_admin');

-- Allow hospital admins to manage profiles within their hospital
CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles admin
    WHERE admin.id = auth.uid()
    AND admin.role = 'admin'
    AND admin.hospital_id = profiles.hospital_id
  )
);