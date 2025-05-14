/*
  # Update Super Admin User

  1. Updates
    - Updates any existing profile with email 'searchable.today@gmail.com' to have the 'super_admin' role
    - If no profile exists but there's a user in auth.users with that email, creates a new profile with super_admin role
*/

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