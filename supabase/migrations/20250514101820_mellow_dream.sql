/*
  # Update Super Admin User

  1. Changes
     - Updates the role of a specific user to 'super_admin'
*/

-- Update the specified user to have super_admin role
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'searchable.today@gmail.com';