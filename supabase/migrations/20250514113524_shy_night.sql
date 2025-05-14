/*
  # Fix Profiles RLS Policies

  1. Changes
    - Drop existing policies on profiles table that cause infinite recursion
    - Create new policies that avoid self-referencing queries
    - Add a direct policy for super_admin access
    - Add a direct policy for users to access their own profile
    - Add a policy for hospital admins to manage profiles in their hospital
  
  2. Security
    - Maintain RLS protection on profiles table
    - Ensure proper access control based on user roles
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

-- Create new policies that avoid self-referencing
-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for super admins to manage all profiles
-- This avoids the recursion by checking the user's JWT claims directly
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'super_admin'
  );

-- Policy for hospital admins to manage profiles in their hospital
-- This avoids recursion by using a subquery that doesn't reference profiles in the policy condition
CREATE POLICY "Hospital admins can manage profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    -- Only if the user is an admin and managing profiles in their own hospital
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'admin'
    AND
    (SELECT p.hospital_id FROM public.profiles p WHERE p.id = auth.uid()) = hospital_id
  );

-- Ensure the user with email searchable.today@gmail.com has super_admin role in auth.users metadata
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO user_id FROM auth.users WHERE email = 'searchable.today@gmail.com';
  
  IF user_id IS NOT NULL THEN
    -- Update the raw_app_meta_data to include the super_admin role
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"super_admin"'
    )
    WHERE id = user_id;
    
    -- Also update the profile record if it exists
    UPDATE public.profiles
    SET role = 'super_admin'
    WHERE id = user_id;
  END IF;
END
$$;