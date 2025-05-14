-- Update the specified user to have super_admin role
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'searchable.today@gmail.com';

-- If the user doesn't exist in profiles table yet, insert them
-- (You'll need to get their UUID from the auth.users table)
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  role,
  email
)
SELECT 
  id,
  'Admin',
  'User',
  'super_admin',
  email
FROM auth.users
WHERE email = 'searchable.today@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'searchable.today@gmail.com'
);