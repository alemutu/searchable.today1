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

-- Update the specified user to have super_admin role
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'searchable.today@gmail.com';

-- If the user doesn't exist in profiles table yet, insert them
-- (This will get their UUID from the auth.users table)
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  role,
  email
)
SELECT 
  id,
  'Super',
  'Admin',
  'super_admin',
  email
FROM auth.users
WHERE email = 'searchable.today@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'searchable.today@gmail.com'
);