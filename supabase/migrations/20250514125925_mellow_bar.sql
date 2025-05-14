/*
  # Fix infinite recursion in profiles policy

  1. Changes
     - Modify the Hospital admins policy to prevent infinite recursion
     - Modify the Super admins policy to prevent infinite recursion
     - Use explicit role checks instead of nested queries
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

-- Create new policies with direct role checks to avoid recursion
CREATE POLICY "Hospital admins can manage profiles in their hospital" 
ON public.profiles
FOR ALL
TO authenticated
USING (
  (role = 'admin' AND hospital_id IS NOT NULL AND hospital_id = profiles.hospital_id)
);

CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles
FOR ALL
TO authenticated
USING (
  role = 'super_admin'
);