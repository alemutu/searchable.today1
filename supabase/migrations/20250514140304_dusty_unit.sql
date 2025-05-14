/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove policies causing infinite recursion
    - Simplify policy structure while maintaining security
    - Use direct checks against auth.uid() instead of recursive profile lookups
    - Add helper function for super admin checks

  2. Security
    - Maintain proper access control for different user roles
    - Ensure hospital admins can only manage users in their hospital
    - Allow users to view and manage their own profiles
*/

-- Create a helper function to check if a user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON public.profiles;
DROP POLICY IF EXISTS "Hospital staff can view profiles from same hospital" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from same hospital" ON public.profiles;

-- Create new, simplified policies
-- 1. Super admins can do anything
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles FOR ALL 
TO authenticated
USING (is_super_admin());

-- 2. Hospital admins can manage profiles in their hospital
CREATE POLICY "Hospital admins can manage profiles in their hospital" 
ON public.profiles FOR ALL 
TO authenticated
USING (
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin' 
  AND hospital_id IS NOT NULL
  AND hospital_id = (SELECT raw_user_meta_data->>'hospital_id' FROM auth.users WHERE id = auth.uid())::uuid
);

-- 3. Users can view and manage their own profile
CREATE POLICY "Users can view and manage own profile" 
ON public.profiles FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Users can view profiles from the same hospital
CREATE POLICY "Users can view profiles from same hospital" 
ON public.profiles FOR SELECT 
TO authenticated
USING (
  hospital_id IS NOT NULL 
  AND hospital_id = (SELECT raw_user_meta_data->>'hospital_id' FROM auth.users WHERE id = auth.uid())::uuid
);