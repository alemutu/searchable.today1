/*
  # Update User Role to Super Admin

  1. Changes
     - Updates the user with email searchable.today@gmail.com to have super_admin role
     - Updates both the auth.users metadata and the profiles table
*/

-- First, update the user's metadata in auth.users table
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"super_admin"'
)
WHERE email = 'searchable.today@gmail.com';

-- Then update the role in the profiles table
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'searchable.today@gmail.com';