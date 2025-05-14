/*
  # Fix profiles table RLS policies

  This migration fixes the infinite recursion issue in the profiles table RLS policies.
  The problem was in the way the policies were checking for admin and super_admin roles,
  which was causing a circular reference.

  1. Changes
     - Drop problematic policies that were causing infinite recursion
     - Create new policies that avoid self-referencing queries
     - Ensure the "Users can read own profile" policy exists and is correctly defined
*/

-- Drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

-- Create new policies that avoid the infinite recursion
CREATE POLICY "Hospital admins can manage profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  (role = 'admin' AND hospital_id IN (
    SELECT hospital_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
);

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  role = 'super_admin' OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Ensure the "Users can read own profile" policy exists
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);