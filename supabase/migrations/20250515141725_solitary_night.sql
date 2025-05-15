/*
  # Fix Infinite Recursion in Profiles RLS Policies

  1. Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new non-recursive policies for profiles table
    - Simplify policy conditions to avoid self-referential queries
*/

-- Drop existing problematic policies with CASCADE to handle dependencies
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles CASCADE;

-- Create new non-recursive policies
CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (role = 'super_admin');

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles FOR ALL
TO authenticated
USING (
  role = 'admin' AND 
  hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can read profiles from same hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  hospital_id = (SELECT hospital_id FROM profiles WHERE id = auth.uid())
);