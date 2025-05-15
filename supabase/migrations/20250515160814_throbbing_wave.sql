/*
  # Add first_login field to profiles table

  1. Changes
    - Add first_login boolean field to profiles table with default true
    - This field will be used to track if a user has changed their password after first login
*/

-- Add first_login field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Create function to handle password change requirement
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Set first_login to true for new users
  NEW.first_login := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set first_login for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON profiles;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();