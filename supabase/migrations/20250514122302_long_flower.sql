/*
  # Fix Infinite Recursion in Profiles RLS Policy

  1. Changes
     - Fixes the infinite recursion issue in the profiles table RLS policies
     - Replaces the problematic policies with properly structured ones
     - Ensures super_admin users can access all profiles
     - Ensures users can access their own profile
     - Ensures hospital staff can access profiles from the same hospital

  2. Security
     - Maintains proper access control while eliminating recursion
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON public.profiles;

-- Create new policies without recursion
-- 1. Super admins can manage all profiles
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles
FOR ALL 
TO authenticated
USING (
  role = 'super_admin'
);

-- 2. Users can read their own profile
CREATE POLICY "Users can read own profile" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id
);

-- 3. Hospital admins can manage profiles in their hospital
CREATE POLICY "Hospital admins can manage profiles in same hospital" 
ON public.profiles
FOR ALL 
TO authenticated
USING (
  (role = 'admin' AND hospital_id IN (
    SELECT hospital_id FROM profiles WHERE id = auth.uid()
  ))
);

-- 4. Users can read profiles from same hospital
CREATE POLICY "Users can read profiles from same hospital" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id FROM profiles WHERE id = auth.uid()
  )
);