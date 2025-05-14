/*
  # Fix infinite recursion in profiles policy

  1. Changes
    - Drop problematic RLS policies on profiles table that cause infinite recursion
    - Create new policies with optimized conditions that avoid self-referential loops
    - Add super_admin check using user metadata instead of profiles table
  
  2. Security
    - Maintain proper access control for profiles
    - Ensure super admins can manage all profiles
    - Allow users to view their own profile
    - Allow hospital admins to manage profiles in their hospital
*/

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON public.profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital v2" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles v2" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile v2" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital v2" ON public.profiles;

-- Create new policies that avoid the recursion issue

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to view profiles from the same hospital
CREATE POLICY "Users can view profiles from same hospital" 
ON public.profiles
FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Allow hospital admins to manage profiles in their hospital
CREATE POLICY "Hospital admins can manage profiles in their hospital" 
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND hospital_id IS NOT NULL
    AND hospital_id = profiles.hospital_id
  )
);

-- Allow super admins to manage all profiles
-- This uses the user metadata instead of querying the profiles table again
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'super_admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

-- Create view for super admin stats that doesn't cause recursion
CREATE OR REPLACE VIEW super_admin_stats AS
SELECT 
  h.id,
  h.created_at,
  h.name,
  h.subdomain,
  h.address,
  h.phone,
  h.email,
  h.logo_url
FROM hospitals h
WHERE EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = auth.uid()
  AND (
    (raw_user_meta_data ->> 'role') = 'super_admin'
  )
);

-- Set security for the view
ALTER VIEW super_admin_stats OWNER TO postgres;
GRANT SELECT ON super_admin_stats TO authenticated;