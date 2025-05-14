/*
  # Fix profiles table RLS policy

  1. Changes
    - Fix the infinite recursion in the profiles table RLS policy
    - Update the "Hospital admins can manage profiles" policy to avoid self-referencing
    - Update the "Super admins can manage all profiles" policy to avoid self-referencing
    - Ensure policies use direct role checks instead of subqueries where possible
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