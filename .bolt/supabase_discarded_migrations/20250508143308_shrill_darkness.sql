/*
  # Fix search path for update_updated_at_column function

  1. Changes
    - Drop existing trigger that depends on the function
    - Drop and recreate function with proper search path
    - Recreate trigger
    - Set proper permissions
*/

-- Drop dependent trigger first
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Drop existing function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate function with explicit search path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Revoke execute from public
REVOKE ALL ON FUNCTION update_updated_at_column() FROM public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;