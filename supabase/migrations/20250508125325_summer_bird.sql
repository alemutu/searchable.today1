/*
  # Fix get_user_role function

  1. Changes
    - Drop existing function to avoid return type conflict
    - Recreate function with correct return type (TABLE)
    - Add security definer and search path settings
    - Grant execute permission to authenticated users

  2. Security
    - Function runs with definer security
    - Restricted search path to public schema
    - Execute permission limited to authenticated users
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Recreate the function with table return type
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TABLE (role text)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.role
  FROM profiles p
  WHERE p.id = user_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;