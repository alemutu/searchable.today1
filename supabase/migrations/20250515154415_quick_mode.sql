/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop existing policies on the profiles table that cause recursion
    - Create new policies that use auth.jwt() to access user metadata directly
    - Implement the same access control rules without self-referencing queries
    - Add a helper function for super admin checks to simplify policies
  
  2. Security
    - Maintains the same access control rules as before
    - Users can still only read their own profile and profiles from their hospital
    - Hospital admins can manage profiles in their hospital
    - Super admins can manage all profiles
*/

-- Create a helper function to check if a user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- This policy uses JWT claims to check hospital_id without querying profiles
CREATE POLICY "Users can read profiles from same hospital"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid = hospital_id
  );

-- Use JWT claims for role checks instead of profiles table
CREATE POLICY "Hospital admins can manage profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin' 
    AND (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid = hospital_id
  );

-- Simplified super admin check using the helper function
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (is_super_admin());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);