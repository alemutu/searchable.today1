/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop existing policies on profiles table that cause recursion
    - Create new policies that avoid self-referencing queries
    - Use auth.jwt() function to access user metadata instead of querying profiles table
  
  2. Security
    - Maintain same access control rules but with improved implementation
    - Ensure users can only access appropriate data
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON public.profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new policies with non-recursive conditions
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- This policy uses auth.jwt() to check hospital_id without querying profiles
CREATE POLICY "Users can read profiles from same hospital"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'hospital_id')::uuid = hospital_id
  );

-- Use auth.jwt() for role checks instead of profiles table
CREATE POLICY "Hospital admins can manage profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' 
    AND (auth.jwt() ->> 'hospital_id')::uuid = hospital_id
  );

-- Simplified super admin check using auth.jwt()
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'super_admin'
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);