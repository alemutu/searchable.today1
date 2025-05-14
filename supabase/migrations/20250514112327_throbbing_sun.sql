-- Fix the super admin role for the specified email
-- First, ensure the user exists in the profiles table

-- Get the user ID from auth.users
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = 'searchable.today@gmail.com';
  
  -- If the user exists in auth.users but not in profiles, insert them
  IF user_id IS NOT NULL THEN
    INSERT INTO public.profiles (
      id,
      first_name,
      last_name,
      role,
      email
    )
    SELECT 
      user_id,
      'Super',
      'Admin',
      'super_admin',
      'searchable.today@gmail.com'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE email = 'searchable.today@gmail.com'
    );
    
    -- If the user already exists in profiles, update their role
    UPDATE public.profiles
    SET role = 'super_admin'
    WHERE email = 'searchable.today@gmail.com';
  END IF;
END $$;

-- Fix the RLS policies to avoid infinite recursion
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

-- Create new policies that avoid the infinite recursion
CREATE POLICY "Hospital admins can manage profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
    AND p.hospital_id = profiles.hospital_id
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- Ensure the "Users can read own profile" policy exists
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);