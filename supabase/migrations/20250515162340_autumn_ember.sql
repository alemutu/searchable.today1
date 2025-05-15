/*
  # Add first_login field to profiles table

  1. Changes
    - Add first_login boolean field to profiles table with default value of true
    - This field will be used to track if a user has changed their password after first login
*/

-- Add first_login field to profiles table
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Update existing profiles to have first_login set to false
UPDATE public.profiles
SET first_login = false
WHERE first_login IS NULL;

-- Create or replace function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, hospital_id, first_login)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'visitor'),
    (NEW.raw_user_meta_data->>'hospital_id')::uuid,
    true  -- Set first_login to true for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add comment to explain the purpose of the field
COMMENT ON COLUMN public.profiles.first_login IS 'Indicates whether this is the user''s first login, requiring a password change';