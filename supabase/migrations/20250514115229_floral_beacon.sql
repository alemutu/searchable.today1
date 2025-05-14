/*
  # Remove admin@hms.dev user
  
  1. Changes
    - Removes the admin@hms.dev user from auth.users table
    - Removes the corresponding profile from profiles table
    
  2. Security
    - Maintains system security by removing unused admin account
*/

-- Remove the profile first (due to foreign key constraint)
DELETE FROM public.profiles
WHERE email = 'admin@hms.dev';

-- Then remove the user from auth.users
DELETE FROM auth.users
WHERE email = 'admin@hms.dev';