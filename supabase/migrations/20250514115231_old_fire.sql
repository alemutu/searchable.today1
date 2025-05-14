/*
  # Update Super Admin User
  
  1. Changes
    - Ensures the user with email 'searchable.today@gmail.com' has super_admin role
    - Updates both the auth.users metadata and the profiles table
    
  2. Security
    - Maintains proper super admin access
    - Ensures consistent role assignment across tables
*/

-- Update the user's metadata in auth.users
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'
)
WHERE email = 'searchable.today@gmail.com';

-- Update or insert the profile record
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = 'searchable.today@gmail.com';
  
  -- If the user exists in auth.users
  IF user_id IS NOT NULL THEN
    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
      -- Update existing profile
      UPDATE profiles 
      SET role = 'super_admin'
      WHERE id = user_id;
    ELSE
      -- Insert new profile
      INSERT INTO profiles (
        id, 
        first_name, 
        last_name, 
        role, 
        email
      ) VALUES (
        user_id, 
        'Super', 
        'Admin', 
        'super_admin', 
        'searchable.today@gmail.com'
      );
    END IF;
  END IF;
END $$;