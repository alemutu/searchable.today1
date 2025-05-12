/*
  # Update Super Admin Password
  
  Updates the password for the existing super admin user.
  
  1. Changes
    - Updates the password for admin@hms.dev to '#$able2050'
*/

-- Update the password for the existing super admin user
UPDATE auth.users
SET encrypted_password = crypt('#$able2050', gen_salt('bf'))
WHERE email = 'admin@hms.dev';