/*
  # Fix handle_new_user function

  1. Changes
    - Update the handle_new_user function to use COALESCE with default values
    - This prevents errors when raw_user_meta_data fields are missing
    - Ensures the trigger works correctly for all user creation scenarios
*/

-- Drop the existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with proper null handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, hospital_id, created_at, updated_at, first_login)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'first_name'), ''),
    COALESCE((NEW.raw_user_meta_data ->> 'last_name'), ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role'), 'visitor'),
    (NEW.raw_user_meta_data ->> 'hospital_id')::uuid,
    NOW(),
    NOW(),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();